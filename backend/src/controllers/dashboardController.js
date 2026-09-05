const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { sendNotification, notifyRole } = require('../services/notificationService');
const { logAudit } = require('../services/auditLogService');

const getDashboardOverview = async (req, res) => {
  try {
    const orgId = req.organizationId;

    // 1. Fetch counts & aggregates in parallel
    const [
      deals,
      invoices,
      pendingApprovals,
      leads,
      accounts,
      recentActivities,
      users,
    ] = await Promise.all([
      prisma.deal.findMany({
        where: { organizationId: orgId },
        include: { account: true, owner: true, quotes: { orderBy: { version: 'desc' }, take: 1 } },
      }),
      prisma.invoice.findMany({
        where: { organizationId: orgId },
      }),
      prisma.approval.findMany({
        where: { organizationId: orgId, status: 'PENDING' },
        include: { quote: true, deal: { include: { account: true, owner: true } }, requestedBy: true },
      }),
      prisma.lead.findMany({
        where: { organizationId: orgId },
      }),
      prisma.account.findMany({
        where: { organizationId: orgId },
      }),
      prisma.activity.findMany({
        where: { organizationId: orgId },
        include: { user: true, deal: true, account: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: { organizationId: orgId, isActive: true },
      }),
    ]);

    // Top Metrics
    const totalPipeline = deals
      .filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage))
      .reduce((sum, d) => sum + d.value, 0);

    const wonDeals = deals.filter((d) => d.stage === 'CLOSED_WON');
    const lostDeals = deals.filter((d) => d.stage === 'CLOSED_LOST');
    const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);

    const winRate = deals.length > 0 ? Number(((wonDeals.length / (wonDeals.length + lostDeals.length || 1)) * 100).toFixed(1)) : 0;
    const avgDealValue = deals.length > 0 ? Number((deals.reduce((s, d) => s + d.value, 0) / deals.length).toFixed(0)) : 0;

    const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalCollected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
    const outstandingInvoices = invoices.reduce((sum, i) => sum + i.amountDue, 0);

    // -------------------------------------------------------------
    // Deal Health & Anomaly Detection (PDF Page 8, B9)
    // -------------------------------------------------------------
    const now = new Date();
    const STALLED_THRESHOLD_DAYS = 7;
    const stalledDeals = [];
    const discountAnomalies = [];
    const deliverySlippages = [];

    for (const deal of deals) {
      if (['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)) continue;

      // 1. Stalled Deals (No activity in > X days)
      const diffDays = Math.floor((now - new Date(deal.lastActivityAt)) / (1000 * 60 * 60 * 24));
      if (diffDays >= STALLED_THRESHOLD_DAYS) {
        stalledDeals.push({
          id: deal.id,
          title: deal.title,
          accountName: deal.account.name,
          stage: deal.stage,
          value: deal.value,
          ownerName: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Unassigned',
          daysInactive: diffDays,
          severity: diffDays > 14 ? 'HIGH' : 'MEDIUM',
        });
      }

      // 2. Discount Anomalies (Quote discount well above rep's historical average)
      const latestQuote = deal.quotes[0];
      if (latestQuote && deal.owner && deal.owner.historicalAvgDiscount) {
        const discountGiven = latestQuote.discountPercent;
        if (discountGiven >= deal.owner.historicalAvgDiscount * 2.0 && discountGiven > 8.0) {
          discountAnomalies.push({
            id: deal.id,
            quoteId: latestQuote.id,
            title: deal.title,
            accountName: deal.account.name,
            ownerName: `${deal.owner.firstName} ${deal.owner.lastName}`,
            discountGiven,
            repAvgDiscount: deal.owner.historicalAvgDiscount,
            blendedRiskScore: latestQuote.blendedRiskScore,
            status: latestQuote.status,
          });
        }
      }

      // 3. Delivery Promise Slippage
      if (deal.deliveryPromiseDate && new Date(deal.deliveryPromiseDate) < now) {
        deliverySlippages.push({
          id: deal.id,
          title: deal.title,
          accountName: deal.account.name,
          deliveryPromiseDate: deal.deliveryPromiseDate,
          ownerName: deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Unassigned',
        });
      }
    }

    // Pipeline by Stage Chart Data
    const stageCounts = {};
    for (const deal of deals) {
      stageCounts[deal.stage] = (stageCounts[deal.stage] || 0) + 1;
    }
    const pipelineByStage = Object.keys(stageCounts).map((stage) => ({
      stage,
      count: stageCounts[stage],
    }));

    // Deals by Sales Rep
    const repDeals = {};
    for (const deal of deals) {
      const name = deal.owner ? `${deal.owner.firstName} ${deal.owner.lastName}` : 'Unassigned';
      repDeals[name] = (repDeals[name] || 0) + deal.value;
    }
    const dealsByRep = Object.keys(repDeals).map((name) => ({
      name,
      value: repDeals[name],
    }));

    return success(res, 'Dashboard overview retrieved', {
      metrics: {
        totalPipeline,
        wonRevenue,
        openDealsCount: deals.filter((d) => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage)).length,
        winRate,
        avgDealValue,
        pendingApprovalsCount: pendingApprovals.length,
        totalBilled,
        totalCollected,
        outstandingInvoices,
        leadsCount: leads.length,
        accountsCount: accounts.length,
      },
      healthAlerts: {
        stalledDeals,
        discountAnomalies,
        deliverySlippages,
        totalAlertsCount: stalledDeals.length + discountAnomalies.length + deliverySlippages.length,
      },
      charts: {
        pipelineByStage,
        dealsByRep,
      },
      pendingApprovals: pendingApprovals.slice(0, 5),
      recentDeals: deals.slice(0, 6),
      recentActivities,
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    return error(res, 'Failed to fetch dashboard overview', err.message, 500);
  }
};

/**
 * 1-Click Automated Nudge or Escalation Trigger from Deal Health Alerts (PDF Page 8, B9)
 */
const triggerHealthAction = async (req, res) => {
  try {
    const { dealId, actionType, customMessage } = req.body; // actionType: 'NUDGE_REP' | 'ESCALATE_MANAGER'

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { owner: true, account: true },
    });

    if (!deal || deal.organizationId !== req.organizationId) {
      return error(res, 'Deal not found', null, 404);
    }

    if (actionType === 'NUDGE_REP' && deal.ownerId) {
      await sendNotification({
        organizationId: req.organizationId,
        userId: deal.ownerId,
        title: `Deal Health Nudge: ${deal.title}`,
        message: customMessage || `Deal with ${deal.account.name} has been stalled. Please follow up with the client or log an activity.`,
        type: 'STALLED_DEAL',
        entityType: 'DEAL',
        entityId: deal.id,
      });
    } else if (actionType === 'ESCALATE_MANAGER') {
      await notifyRole({
        organizationId: req.organizationId,
        role: 'SALES_MANAGER',
        title: `Deal Escalation Alert: ${deal.title}`,
        message: customMessage || `Critical deal with ${deal.account.name} (Value: ₹${deal.value.toLocaleString('en-IN')}) requires managerial intervention.`,
        type: 'ANOMALY',
        entityType: 'DEAL',
        entityId: deal.id,
      });
    }

    // Touch lastActivityAt to refresh stall status
    await prisma.deal.update({
      where: { id: dealId },
      data: { lastActivityAt: new Date() },
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: actionType === 'NUDGE_REP' ? 'DEAL_NUDGE_SENT' : 'DEAL_ESCALATED',
      entity: 'DEAL',
      entityId: dealId,
      newState: { actionType, triggeredBy: req.user.email },
    });

    return success(res, `Health action '${actionType}' triggered successfully`);
  } catch (err) {
    return error(res, 'Failed to trigger health action', err.message, 500);
  }
};

module.exports = {
  getDashboardOverview,
  triggerHealthAction,
};
