const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');

const getRevenueAnalytics = async (req, res) => {
  try {
    const records = await prisma.revenueRecord.findMany({
      where: { organizationId: req.organizationId },
      include: {
        account: true,
        deal: { include: { owner: true } },
        invoice: true,
      },
      orderBy: { recognizedDate: 'desc' },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { organizationId: req.organizationId, status: 'ACTIVE' },
      include: { product: true },
    });

    // Calculations
    const totalRecognizedRevenue = records.reduce((sum, r) => sum + r.amount, 0);
    const oneTimeRevenue = records.filter((r) => r.type === 'ONE_TIME').reduce((sum, r) => sum + r.amount, 0);
    const recurringRevenue = records.filter((r) => r.type === 'RECURRING').reduce((sum, r) => sum + r.amount, 0);

    // Monthly Recurring Revenue (MRR)
    const mrr = subscriptions.reduce((sum, s) => {
      let monthlyRate = s.recurringAmount;
      if (s.billingCycle === 'ANNUAL') monthlyRate = s.recurringAmount / 12;
      if (s.billingCycle === 'QUARTERLY') monthlyRate = s.recurringAmount / 3;
      return sum + monthlyRate;
    }, 0);
    const arr = mrr * 12;

    // Monthly Revenue Trend (Last 6 Months)
    const monthlyTrend = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      monthlyTrend[months[mIdx]] = 0;
    }

    for (const rec of records) {
      const mName = months[rec.periodMonth - 1];
      if (monthlyTrend[mName] !== undefined) {
        monthlyTrend[mName] += rec.amount;
      }
    }

    const chartData = Object.keys(monthlyTrend).map((month) => ({
      month,
      revenue: monthlyTrend[month],
    }));

    // Revenue by Sales Rep
    const repRevenueMap = {};
    for (const rec of records) {
      const repName = rec.deal && rec.deal.owner ? `${rec.deal.owner.firstName} ${rec.deal.owner.lastName}` : 'Unassigned';
      repRevenueMap[repName] = (repRevenueMap[repName] || 0) + rec.amount;
    }

    const repRevenueData = Object.keys(repRevenueMap).map((name) => ({
      name,
      amount: repRevenueMap[name],
    }));

    return success(res, 'Revenue analytics retrieved', {
      totalRecognizedRevenue: Number(totalRecognizedRevenue.toFixed(2)),
      oneTimeRevenue: Number(oneTimeRevenue.toFixed(2)),
      recurringRevenue: Number(recurringRevenue.toFixed(2)),
      mrr: Number(mrr.toFixed(2)),
      arr: Number(arr.toFixed(2)),
      activeSubscriptionsCount: subscriptions.length,
      monthlyTrend: chartData,
      repRevenueData,
      recentRecords: records.slice(0, 15),
    });
  } catch (err) {
    return error(res, 'Failed to fetch revenue analytics', err.message, 500);
  }
};

const getReportsAnalytics = async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      where: { organizationId: req.organizationId },
      include: { account: true, owner: true, quotes: true },
    });

    const products = await prisma.product.findMany({
      where: { organizationId: req.organizationId },
      include: { quoteItems: true },
    });

    // 1. Weighted pipeline calculation
    const weightedPipeline = deals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
    const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);

    // 2. Product Performance
    const productPerformance = products.map((p) => {
      const unitsSold = p.quoteItems.reduce((sum, it) => sum + it.quantity, 0);
      const grossRevenue = p.quoteItems.reduce((sum, it) => sum + it.totalAmount, 0);
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        unitsSold,
        grossRevenue,
        basePrice: p.basePrice,
      };
    }).sort((a, b) => b.grossRevenue - a.grossRevenue);

    // 3. Rep Commission Calculation (e.g. 5% commission on closed won, 2% on pipeline)
    const reps = await prisma.user.findMany({
      where: { organizationId: req.organizationId },
      include: { ownedDeals: true },
    });

    const repCommissions = reps.map((rep) => {
      const wonDeals = rep.ownedDeals.filter((d) => d.stage === 'CLOSED_WON' || d.stage === 'APPROVED');
      const wonAmount = wonDeals.reduce((sum, d) => sum + d.value, 0);
      const pipelineAmount = rep.ownedDeals.reduce((sum, d) => sum + d.value, 0);
      const commission = wonAmount * 0.05; // 5% baseline

      return {
        id: rep.id,
        name: `${rep.firstName} ${rep.lastName}`,
        role: rep.role,
        dealsCount: rep.ownedDeals.length,
        wonAmount,
        pipelineAmount,
        estimatedCommission: commission,
      };
    });

    return success(res, 'Reports analytics generated', {
      weightedPipeline: Number(weightedPipeline.toFixed(2)),
      totalPipelineValue: Number(totalPipelineValue.toFixed(2)),
      productPerformance,
      repCommissions,
      dealStageBreakdown: deals.reduce((acc, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + 1;
        return acc;
      }, {}),
    });
  } catch (err) {
    return error(res, 'Failed to generate reports', err.message, 500);
  }
};

module.exports = {
  getRevenueAnalytics,
  getReportsAnalytics,
};
