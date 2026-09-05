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

module.exports = {
  getRevenueAnalytics,
};
