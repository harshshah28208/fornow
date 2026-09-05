const prisma = require('../config/db');

/**
 * Dynamic pricing calculation engine for one-time and recurring items.
 */
const calculatePricing = async ({
  organizationId,
  items = [], // [{ productId, productPlanId, quantity, discountPercent }]
  customerTier = 'BRONZE',
}) => {
  let subtotal = 0;
  let totalCost = 0;
  let totalDiscountAmount = 0;
  let totalTaxAmount = 0;
  let oneTimeTotal = 0;
  let recurringTotal = 0;

  const processedItems = [];

  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, organizationId },
      include: { plans: true },
    });

    if (!product) continue;

    let unitPrice = product.basePrice;
    let billingModel = product.billingModel;
    let plan = null;

    if (item.productPlanId) {
      plan = product.plans.find((p) => p.id === item.productPlanId);
      if (plan) {
        unitPrice = plan.price;
        billingModel = 'RECURRING';
      }
    }

    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    const itemSubtotal = unitPrice * qty;
    const itemCost = (product.costPrice || 0) * qty;
    const discountPct = Math.min(100, Math.max(0, parseFloat(item.discountPercent || 0)));
    const discountAmt = (itemSubtotal * discountPct) / 100;
    const taxableAmount = itemSubtotal - discountAmt;
    const taxAmt = (taxableAmount * (product.taxPercent || 0)) / 100;
    const itemTotal = taxableAmount + taxAmt;

    subtotal += itemSubtotal;
    totalCost += itemCost;
    totalDiscountAmount += discountAmt;
    totalTaxAmount += taxAmt;

    if (billingModel === 'RECURRING') {
      recurringTotal += itemTotal;
    } else {
      oneTimeTotal += itemTotal;
    }

    processedItems.push({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      category: product.category,
      billingModel,
      productPlanId: plan ? plan.id : null,
      planName: plan ? plan.name : null,
      quantity: qty,
      unitPrice,
      costPrice: product.costPrice || 0,
      discountPercent: discountPct,
      discountAmount: discountAmt,
      taxPercent: product.taxPercent,
      taxAmount: taxAmt,
      totalAmount: itemTotal,
      marginPercent: itemTotal > 0 ? (((itemTotal - itemCost) / itemTotal) * 100).toFixed(1) : 0,
    });
  }

  const finalTotal = subtotal - totalDiscountAmount + totalTaxAmount;
  const overallMargin = finalTotal > 0 ? (((finalTotal - totalCost) / finalTotal) * 100).toFixed(1) : 0;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    costSubtotal: Number(totalCost.toFixed(2)),
    discountAmount: Number(totalDiscountAmount.toFixed(2)),
    discountPercent: subtotal > 0 ? Number(((totalDiscountAmount / subtotal) * 100).toFixed(2)) : 0,
    taxAmount: Number(totalTaxAmount.toFixed(2)),
    totalAmount: Number(finalTotal.toFixed(2)),
    oneTimeTotal: Number(oneTimeTotal.toFixed(2)),
    recurringTotal: Number(recurringTotal.toFixed(2)),
    marginPercent: Number(overallMargin),
    items: processedItems,
  };
};

/**
 * Mid-cycle proration calculator for subscription changes.
 */
const calculateProration = ({
  oldPlanPrice,
  newPlanPrice,
  daysRemainingInPeriod,
  totalDaysInPeriod = 30,
}) => {
  const dailyOldRate = oldPlanPrice / totalDaysInPeriod;
  const dailyNewRate = newPlanPrice / totalDaysInPeriod;

  const unusedCredit = dailyOldRate * daysRemainingInPeriod;
  const newCharge = dailyNewRate * daysRemainingInPeriod;
  const prorationDelta = newCharge - unusedCredit;

  return {
    unusedCredit: Number(unusedCredit.toFixed(2)),
    newCharge: Number(newCharge.toFixed(2)),
    prorationDelta: Number(prorationDelta.toFixed(2)), // Positive = charge, Negative = credit note
  };
};

/**
 * Finds intelligent upsell & cross-sell recommendations with real-time margin deltas.
 */
const getUpsellRecommendations = async ({ organizationId, productIds = [] }) => {
  if (!productIds.length) return [];

  const upsellRules = await prisma.upsellRule.findMany({
    where: {
      organizationId,
      sourceProductId: { in: productIds },
      suggestedProductId: { notIn: productIds },
    },
    include: {
      suggestedProduct: {
        include: { plans: true },
      },
    },
    orderBy: { confidenceScore: 'desc' },
    take: 4,
  });

  return upsellRules.map((rule) => ({
    id: rule.id,
    productId: rule.suggestedProduct.id,
    name: rule.suggestedProduct.name,
    category: rule.suggestedProduct.category,
    basePrice: rule.suggestedProduct.basePrice,
    unit: rule.suggestedProduct.unit,
    confidenceScore: rule.confidenceScore,
    marginDelta: rule.marginDelta,
    promotionTag: rule.promotionTag || 'Recommended Pairing',
    plans: rule.suggestedProduct.plans,
  }));
};

module.exports = {
  calculatePricing,
  calculateProration,
  getUpsellRecommendations,
};
