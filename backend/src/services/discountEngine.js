const prisma = require('../config/db');

/**
 * Calculates the blended discount risk score and required approval hierarchy.
 * Formulated according to DealFlow360 business rules:
 * - Line-level category ceilings (e.g. Services 10% vs Hardware 15%)
 * - Customer tier base allowances (Bronze: 5%, Silver: 10%, Gold: 15%, Platinum: 20%)
 * - Blended risk score for cumulative margin erosion
 * - Historical anomaly detection per sales rep
 */
const evaluateQuoteDiscount = async ({
  organizationId,
  customerTier = 'BRONZE',
  items = [], // [{ category, unitPrice, quantity, discountPercent, costPrice }]
  orderLevelDiscount = 0,
  repId = null,
}) => {
  // Fetch active discount rules for organization
  const discountRules = await prisma.discountRule.findMany({
    where: { organizationId, isActive: true },
    orderBy: { sequenceOrder: 'asc' },
  });

  // Default tier limits if no specific rules exist
  const tierCeilings = {
    BRONZE: 5.0,
    SILVER: 10.0,
    GOLD: 15.0,
    PLATINUM: 20.0,
  };

  const categoryCeilings = {
    HARDWARE: 15.0,
    SERVICES: 10.0,
    SUBSCRIPTION: 10.0,
  };

  const baseTierAllowance = tierCeilings[customerTier.toUpperCase()] || 5.0;

  let totalSubtotal = 0;
  let totalDiscountAmount = 0;
  let totalCost = 0;
  let weightedViolationSum = 0;
  const lineEvaluations = [];

  for (const item of items) {
    const itemSubtotal = (item.unitPrice || 0) * (item.quantity || 1);
    const itemCost = (item.costPrice || 0) * (item.quantity || 1);
    const itemDiscountPct = Number(item.discountPercent || orderLevelDiscount || 0);
    const itemDiscountAmt = (itemSubtotal * itemDiscountPct) / 100;
    const itemFinalTotal = Math.max(0, itemSubtotal - itemDiscountAmt);

    totalSubtotal += itemSubtotal;
    totalDiscountAmount += itemDiscountAmt;
    totalCost += itemCost;

    // Determine category ceiling
    const cat = (item.category || 'HARDWARE').toUpperCase();
    const specificRule = discountRules.find(
      (r) =>
        (r.customerTier === 'ALL' || r.customerTier === customerTier) &&
        (r.productCategory === 'ALL' || r.productCategory === cat)
    );

    const repMaxLimit = specificRule ? specificRule.maxRepDiscount : Math.min(baseTierAllowance, categoryCeilings[cat] || 10.0);
    const managerMaxLimit = specificRule ? specificRule.maxManagerDiscount : 15.0;
    const financeMaxLimit = specificRule ? specificRule.maxFinanceDiscount : 30.0;

    // Line violation
    const violation = Math.max(0, itemDiscountPct - repMaxLimit);
    weightedViolationSum += violation * itemSubtotal;

    lineEvaluations.push({
      category: cat,
      subtotal: itemSubtotal,
      discountPercent: itemDiscountPct,
      discountAmount: itemDiscountAmt,
      totalAmount: itemFinalTotal,
      repMaxLimit,
      managerMaxLimit,
      financeMaxLimit,
      isOverRepLimit: itemDiscountPct > repMaxLimit,
      isOverManagerLimit: itemDiscountPct > managerMaxLimit,
      isOverFinanceLimit: itemDiscountPct > financeMaxLimit,
      marginPercent: itemFinalTotal > 0 ? ((itemFinalTotal - itemCost) / itemFinalTotal) * 100 : 0,
    });
  }

  // Calculate Overall Blended Risk Score
  const overallDiscountPercent = totalSubtotal > 0 ? (totalDiscountAmount / totalSubtotal) * 100 : 0;
  const blendedRiskScore = totalSubtotal > 0 ? Number((weightedViolationSum / totalSubtotal).toFixed(2)) : 0;
  const overallFinalTotal = Math.max(0, totalSubtotal - totalDiscountAmount);
  const overallMarginPercent = overallFinalTotal > 0 ? Number((((overallFinalTotal - totalCost) / overallFinalTotal) * 100).toFixed(2)) : 0;

  // Determine Required Approval Hierarchy
  let requiredApprovalRole = 'NONE';
  let requiresApproval = false;
  let approvalReason = 'Standard pricing within sales rep discretionary limit.';

  const hasFinanceViolation = lineEvaluations.some((l) => l.isOverManagerLimit) || blendedRiskScore > 10.0 || overallDiscountPercent > 20.0;
  const hasManagerViolation = lineEvaluations.some((l) => l.isOverRepLimit) || blendedRiskScore > 0 || overallDiscountPercent > baseTierAllowance;
  const hasAdminViolation = lineEvaluations.some((l) => l.isOverFinanceLimit) || overallDiscountPercent > 35.0;

  if (hasAdminViolation) {
    requiredApprovalRole = 'ORG_ADMIN';
    requiresApproval = true;
    approvalReason = `Critical Discount Threshold Exceeded (${overallDiscountPercent.toFixed(1)}%). Requires Organization Admin override.`;
  } else if (hasFinanceViolation) {
    requiredApprovalRole = 'FINANCE';
    requiresApproval = true;
    approvalReason = `High margin risk (Blended Risk Score: ${blendedRiskScore}, Discount: ${overallDiscountPercent.toFixed(1)}%). Requires Sales Manager & Finance approval.`;
  } else if (hasManagerViolation) {
    requiredApprovalRole = 'SALES_MANAGER';
    requiresApproval = true;
    approvalReason = `Discount exceeds Sales Rep discretionary ceiling (Blended Risk Score: ${blendedRiskScore}, Discount: ${overallDiscountPercent.toFixed(1)}%). Requires Sales Manager review.`;
  }

  // Anomaly Detection: Compare against rep's historical average
  let isDiscountAnomaly = false;
  let anomalyMessage = null;

  if (repId) {
    const rep = await prisma.user.findUnique({ where: { id: repId } });
    if (rep && rep.historicalAvgDiscount) {
      if (overallDiscountPercent > rep.historicalAvgDiscount * 2.5 && overallDiscountPercent > 8.0) {
        isDiscountAnomaly = true;
        anomalyMessage = `Proposed discount (${overallDiscountPercent.toFixed(1)}%) is significantly higher than ${rep.firstName}'s historical average (${rep.historicalAvgDiscount.toFixed(1)}%).`;
      }
    }
  }

  return {
    subtotal: totalSubtotal,
    costSubtotal: totalCost,
    discountPercent: Number(overallDiscountPercent.toFixed(2)),
    discountAmount: Number(totalDiscountAmount.toFixed(2)),
    totalAmount: Number(overallFinalTotal.toFixed(2)),
    marginPercent: overallMarginPercent,
    blendedRiskScore,
    requiresApproval,
    requiredApprovalRole,
    approvalReason,
    isDiscountAnomaly,
    anomalyMessage,
    lineEvaluations,
  };
};

module.exports = {
  evaluateQuoteDiscount,
};
