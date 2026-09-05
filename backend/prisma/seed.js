const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DealFlow360 Database with realistic enterprise data...');

  // 1. Clean existing records
  await prisma.activity.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.revenueRecord.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.contractVersion.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quoteItem.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.upsellRule.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.productPlan.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.discountRule.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.organization.deleteMany({});

  // 2. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Acme Cloud Enterprise',
      slug: 'acme-cloud-enterprise',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      plan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      billingCycle: 'ANNUAL',
      renewalDate: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Organization created: ${org.name}`);

  // 3. Users with all required roles
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const admin = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'admin@dealflow360.com',
      passwordHash,
      firstName: 'Aarav',
      lastName: 'Mehta',
      role: 'ORG_ADMIN',
      title: 'VP of Revenue Operations',
      historicalAvgDiscount: 5.0,
    },
  });

  const manager = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'manager@dealflow360.com',
      passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'SALES_MANAGER',
      title: 'Regional Sales Director',
      historicalAvgDiscount: 7.5,
    },
  });

  const rep = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'rep@dealflow360.com',
      passwordHash,
      firstName: 'Rohan',
      lastName: 'Verma',
      role: 'SALES_REP',
      title: 'Senior Account Executive',
      historicalAvgDiscount: 4.8,
    },
  });

  const finance = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'finance@dealflow360.com',
      passwordHash,
      firstName: 'Vikram',
      lastName: 'Singhania',
      role: 'FINANCE',
      title: 'Head of Commercial Finance',
      historicalAvgDiscount: 0.0,
    },
  });

  const legal = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'legal@dealflow360.com',
      passwordHash,
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      role: 'LEGAL',
      title: 'Senior Legal Counsel',
      historicalAvgDiscount: 0.0,
    },
  });

  const ops = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'ops@dealflow360.com',
      passwordHash,
      firstName: 'Karan',
      lastName: 'Patel',
      role: 'OPERATIONS',
      title: 'Fulfillment & Logistics Lead',
      historicalAvgDiscount: 0.0,
    },
  });

  console.log('✅ Users across all roles created with password "Password@123"');

  // 4. Warehouses
  const mainWh = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'Main Distribution Center',
      code: 'WH-MUMBAI-MAIN',
      location: 'Bhiwandi Logistics Park, Mumbai',
      shippingCostWeight: 1.0,
      isMain: true,
    },
  });

  const eastDepot = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'East Coast Depot',
      code: 'WH-KOLKATA-EAST',
      location: 'Dankuni Cargo Complex, Kolkata',
      shippingCostWeight: 1.4,
      isMain: false,
    },
  });

  const southHub = await prisma.warehouse.create({
    data: {
      organizationId: org.id,
      name: 'South Technology Hub',
      code: 'WH-BLR-SOUTH',
      location: 'Peenya Industrial Area, Bengaluru',
      shippingCostWeight: 1.15,
      isMain: false,
    },
  });

  console.log('✅ Multi-warehouses created');

  // 5. Products & Product Plans
  const workstation = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Enterprise Developer Workstation Z8',
      code: 'HW-Z8-PRO',
      category: 'HARDWARE',
      billingModel: 'ONE_TIME',
      basePrice: 185000,
      costPrice: 135000,
      unit: 'Device',
      taxPercent: 18.0,
      maxDiscountPercent: 15.0,
      description: 'High-performance AI/ML developer workstation with 64GB RAM and RTX GPU.',
      isPromoted: true,
    },
  });

  const rackServer = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'PowerEdge R750 Rack Server',
      code: 'HW-SRV-R750',
      category: 'HARDWARE',
      billingModel: 'ONE_TIME',
      basePrice: 420000,
      costPrice: 310000,
      unit: 'Server',
      taxPercent: 18.0,
      maxDiscountPercent: 15.0,
      description: 'Dual-socket 2U rack server optimized for application performance and acceleration.',
    },
  });

  const deploymentSvc = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Onsite Architecture Deployment & Hardening',
      code: 'SVC-DEPLOY-PRO',
      category: 'SERVICES',
      billingModel: 'ONE_TIME',
      basePrice: 95000,
      costPrice: 75000,
      unit: 'Engagement',
      taxPercent: 18.0,
      maxDiscountPercent: 10.0,
      description: 'White-glove infrastructure configuration, security hardening and data center setup.',
    },
  });

  const cloudSaaS = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'DealFlow360 Enterprise Deal Engine License',
      code: 'SW-DF360-ENT',
      category: 'SUBSCRIPTION',
      billingModel: 'RECURRING',
      basePrice: 3500,
      costPrice: 800,
      unit: 'User / Month',
      taxPercent: 18.0,
      maxDiscountPercent: 12.0,
      description: 'Complete deal governance, approval automation and customer negotiation portal.',
      isPromoted: true,
      plans: {
        create: [
          { name: 'Monthly Standard', billingCycle: 'MONTHLY', price: 3500, setupFee: 5000 },
          { name: 'Annual Pro (Billed Yearly)', billingCycle: 'ANNUAL', price: 35000, setupFee: 0 },
        ],
      },
    },
  });

  const premiumSLA = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: '24/7 Priority Mission-Critical SLA & TAM Support',
      code: 'SVC-SLA-24X7',
      category: 'SUBSCRIPTION',
      billingModel: 'RECURRING',
      basePrice: 25000,
      costPrice: 12000,
      unit: 'Month',
      taxPercent: 18.0,
      maxDiscountPercent: 10.0,
      description: 'Dedicated Technical Account Manager and 15-minute response SLA.',
      plans: {
        create: [
          { name: 'Monthly Support Tier', billingCycle: 'MONTHLY', price: 25000 },
          { name: 'Annual Dedicated Support', billingCycle: 'ANNUAL', price: 270000 },
        ],
      },
    },
  });

  console.log('✅ Products and Subscription Plans created');

  // 6. Stock Levels Across Warehouses (for multi-warehouse split demonstration)
  await prisma.stock.createMany({
    data: [
      // Workstation: 8 in Mumbai, 12 in Kolkata, 15 in Bangalore
      { productId: workstation.id, warehouseId: mainWh.id, quantity: 8, reservedQty: 2 },
      { productId: workstation.id, warehouseId: eastDepot.id, quantity: 12, reservedQty: 0 },
      { productId: workstation.id, warehouseId: southHub.id, quantity: 15, reservedQty: 3 },
      // Server: 3 in Mumbai, 1 in Kolkata, 5 in Bangalore
      { productId: rackServer.id, warehouseId: mainWh.id, quantity: 3, reservedQty: 1 },
      { productId: rackServer.id, warehouseId: eastDepot.id, quantity: 1, reservedQty: 0 },
      { productId: rackServer.id, warehouseId: southHub.id, quantity: 5, reservedQty: 0 },
    ],
  });

  // 7. Upsell Rules (Co-Purchase Pairing with Margin Deltas)
  await prisma.upsellRule.createMany({
    data: [
      {
        organizationId: org.id,
        sourceProductId: workstation.id,
        suggestedProductId: deploymentSvc.id,
        confidenceScore: 0.92,
        marginDelta: 14.5,
        promotionTag: 'Essential Pairing (82% Attach Rate)',
      },
      {
        organizationId: org.id,
        sourceProductId: rackServer.id,
        suggestedProductId: premiumSLA.id,
        confidenceScore: 0.88,
        marginDelta: 18.2,
        promotionTag: 'High Margin Add-on',
      },
      {
        organizationId: org.id,
        sourceProductId: workstation.id,
        suggestedProductId: cloudSaaS.id,
        confidenceScore: 0.85,
        marginDelta: 22.0,
        promotionTag: 'Bundle & Save 10%',
      },
    ],
  });

  // 8. Discount Governance Rules
  await prisma.discountRule.createMany({
    data: [
      {
        organizationId: org.id,
        name: 'Enterprise Gold Tier Discount Rule',
        customerTier: 'GOLD',
        productCategory: 'ALL',
        maxRepDiscount: 7.0,
        maxManagerDiscount: 15.0,
        maxFinanceDiscount: 25.0,
        sequenceOrder: 1,
      },
      {
        organizationId: org.id,
        name: 'Hardware Pricing Discipline Rule',
        customerTier: 'ALL',
        productCategory: 'HARDWARE',
        maxRepDiscount: 5.0,
        maxManagerDiscount: 15.0,
        maxFinanceDiscount: 30.0,
        sequenceOrder: 2,
      },
      {
        organizationId: org.id,
        name: 'Services Strict Margin Rule (Low Discretion)',
        customerTier: 'ALL',
        productCategory: 'SERVICES',
        maxRepDiscount: 3.0,
        maxManagerDiscount: 10.0,
        maxFinanceDiscount: 18.0,
        sequenceOrder: 3,
      },
      {
        organizationId: org.id,
        name: 'SaaS Multi-Year Subscription Rule',
        customerTier: 'ALL',
        productCategory: 'SUBSCRIPTION',
        maxRepDiscount: 5.0,
        maxManagerDiscount: 15.0,
        maxFinanceDiscount: 25.0,
        sequenceOrder: 4,
      },
    ],
  });

  console.log('✅ Discount Rules and Upsell Pairings configured');

  // 9. Accounts & Contacts
  const accNexus = await prisma.account.create({
    data: {
      organizationId: org.id,
      ownerId: rep.id,
      name: 'Nexus FinTech Global',
      industry: 'Financial Services & Banking',
      size: '1000+',
      segment: 'ENTERPRISE',
      tier: 'GOLD', // 15% Max standard ceiling
      website: 'https://nexusfintech.example.com',
      phone: '+91 22 6123 4567',
      address: 'Bandra-Kurla Complex (BKC), Mumbai, Maharashtra 400051',
      status: 'ACTIVE',
    },
  });

  const contactNexus = await prisma.contact.create({
    data: {
      organizationId: org.id,
      accountId: accNexus.id,
      firstName: 'Siddharth',
      lastName: 'Kapoor',
      email: 'siddharth.kapoor@nexusfintech.example.com',
      phone: '+91 98200 12345',
      jobTitle: 'Chief Technology Officer (CTO)',
      isDecisionMaker: true,
    },
  });

  const accZenith = await prisma.account.create({
    data: {
      organizationId: org.id,
      ownerId: rep.id,
      name: 'Zenith Health Dynamics',
      industry: 'Healthcare & Diagnostics',
      size: '201-1000',
      segment: 'MID_MARKET',
      tier: 'SILVER',
      website: 'https://zenithhealth.example.com',
      phone: '+91 80 4123 7890',
      address: 'Electronic City Phase 1, Bengaluru, Karnataka 560100',
      status: 'ACTIVE',
    },
  });

  const contactZenith = await prisma.contact.create({
    data: {
      organizationId: org.id,
      accountId: accZenith.id,
      firstName: 'Meera',
      lastName: 'Nambiar',
      email: 'meera.n@zenithhealth.example.com',
      phone: '+91 98450 67890',
      jobTitle: 'VP of Engineering',
      isDecisionMaker: true,
    },
  });

  const accApex = await prisma.account.create({
    data: {
      organizationId: org.id,
      ownerId: rep.id,
      name: 'Apex Logistics Networks',
      industry: 'Supply Chain & Logistics',
      size: '51-200',
      segment: 'SMB',
      tier: 'BRONZE',
      website: 'https://apexlogistics.example.com',
      phone: '+91 33 2289 9900',
      address: 'Sector V, Salt Lake, Kolkata, West Bengal 700091',
      status: 'ACTIVE',
    },
  });

  // 10. Leads
  await prisma.lead.createMany({
    data: [
      {
        organizationId: org.id,
        ownerId: rep.id,
        firstName: 'Rahul',
        lastName: 'Menon',
        company: 'Tata Retail Digital',
        email: 'rahul.m@tataretail.example.com',
        phone: '+91 99300 88221',
        source: 'CAMPAIGN',
        status: 'QUALIFIED',
        estimatedValue: 450000,
        notes: 'Requested proposal for 10 developer workstations and onsite installation.',
      },
      {
        organizationId: org.id,
        ownerId: rep.id,
        firstName: 'Divya',
        lastName: 'Choudhary',
        company: 'Bharat Biotech Informatics',
        email: 'divya.c@bharatbio.example.com',
        phone: '+91 94400 33445',
        source: 'REFERRAL',
        status: 'NEW',
        estimatedValue: 850000,
        notes: 'Inbound referral from Nexus CTO. Interested in Rack servers and SaaS deal engine.',
      },
    ],
  });

  console.log('✅ Accounts, Contacts, and Leads seeded');

  // 11. Complete Deal & Approved Flow (Nexus Deal)
  const nexusDeal = await prisma.deal.create({
    data: {
      organizationId: org.id,
      accountId: accNexus.id,
      contactId: contactNexus.id,
      ownerId: rep.id,
      title: 'Nexus FinTech - Trading Infrastructure & SaaS Expansion',
      value: 1250000,
      costTotal: 860000,
      marginPercent: 31.2,
      stage: 'CLOSED_WON',
      probability: 100,
      expectedCloseDate: new Date(),
      deliveryPromiseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
    },
  });

  // Nexus Quote
  const quote1 = await prisma.quote.create({
    data: {
      organizationId: org.id,
      dealId: nexusDeal.id,
      version: 1,
      quoteNumber: 'QT-2026-0001-V1',
      status: 'APPROVED',
      subtotal: 1390000,
      costSubtotal: 960000,
      discountPercent: 10.0,
      discountAmount: 139000,
      blendedRiskScore: 2.5,
      requiredApprovalRole: 'SALES_MANAGER',
      taxAmount: 225180,
      totalAmount: 1476180,
      oneTimeTotal: 1146180,
      recurringTotal: 330000,
      billingFrequency: 'MONTHLY',
      marginPercent: 30.8,
      notes: 'Standard enterprise volume pricing with multi-warehouse split across Mumbai and Bangalore.',
      items: {
        create: [
          {
            productId: workstation.id,
            warehouseId: mainWh.id,
            quantity: 5,
            unitPrice: 185000,
            costPrice: 135000,
            discountPercent: 10.0,
            discountAmount: 92500,
            taxAmount: 149850,
            totalAmount: 982350,
            billingModel: 'ONE_TIME',
          },
          {
            productId: deploymentSvc.id,
            quantity: 1,
            unitPrice: 95000,
            costPrice: 75000,
            discountPercent: 5.0,
            discountAmount: 4750,
            taxAmount: 16245,
            totalAmount: 106495,
            billingModel: 'ONE_TIME',
          },
          {
            productId: cloudSaaS.id,
            quantity: 50,
            unitPrice: 3500,
            costPrice: 800,
            discountPercent: 10.0,
            discountAmount: 17500,
            taxAmount: 28350,
            totalAmount: 185850,
            billingModel: 'RECURRING',
          },
        ],
      },
    },
  });

  // Nexus Approval Record
  await prisma.approval.create({
    data: {
      organizationId: org.id,
      quoteId: quote1.id,
      dealId: nexusDeal.id,
      requestedById: rep.id,
      approverId: manager.id,
      approverRole: 'SALES_MANAGER',
      requestedDiscount: 10.0,
      thresholdDiscount: 7.0,
      riskScore: 2.5,
      reason: 'Volume discount for 5 Developer Workstations + 50 SaaS licenses',
      status: 'APPROVED',
      comments: 'Approved by Sales Manager. Healthy margins preserved.',
      decidedAt: new Date(),
    },
  });

  // Nexus Contract
  const contractNexus = await prisma.contract.create({
    data: {
      organizationId: org.id,
      dealId: nexusDeal.id,
      quoteId: quote1.id,
      accountId: accNexus.id,
      contractNumber: 'CTR-2026-0001',
      title: 'Enterprise Master Services Agreement - Nexus FinTech',
      value: quote1.totalAmount,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      terms: 'Standard Master Services Agreement with 99.9% uptime SLA, 30 days Net terms.',
      status: 'SIGNED',
      legalReviewerId: legal.id,
      legalNotes: 'Approved with standard indemnity and limitation of liability clauses.',
      signedAt: new Date(),
      signerName: 'Siddharth Kapoor',
      signerEmail: 'siddharth.kapoor@nexusfintech.example.com',
      versions: {
        create: {
          version: 1,
          terms: 'Standard Master Services Agreement with 99.9% uptime SLA, 30 days Net terms.',
          changesDescription: 'Initial contract approved and executed.',
          createdById: rep.id,
        },
      },
    },
  });

  // Nexus Invoice & Payments
  const invoiceNexus = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      dealId: nexusDeal.id,
      contractId: contractNexus.id,
      accountId: accNexus.id,
      invoiceNumber: 'INV-2026-0001',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: quote1.subtotal,
      discountAmount: quote1.discountAmount,
      taxAmount: quote1.taxAmount,
      totalAmount: quote1.totalAmount,
      amountPaid: 800000,
      amountDue: quote1.totalAmount - 800000,
      status: 'PARTIALLY_PAID',
      items: {
        create: [
          {
            productId: workstation.id,
            description: 'Enterprise Developer Workstation Z8 (ONE_TIME)',
            quantity: 5,
            unitPrice: 185000,
            discountAmount: 92500,
            taxAmount: 149850,
            totalAmount: 982350,
            billingType: 'ONE_TIME',
          },
          {
            productId: deploymentSvc.id,
            description: 'Onsite Architecture Deployment & Hardening (ONE_TIME)',
            quantity: 1,
            unitPrice: 95000,
            discountAmount: 4750,
            taxAmount: 16245,
            totalAmount: 106495,
            billingType: 'ONE_TIME',
          },
        ],
      },
    },
  });

  // Record Partial Payment & Revenue
  await prisma.payment.create({
    data: {
      organizationId: org.id,
      invoiceId: invoiceNexus.id,
      paymentNumber: 'PAY-2026-0001',
      amount: 800000,
      paymentDate: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      reference: 'NEFT-HDFC-992817263',
      status: 'COMPLETED',
    },
  });

  const now = new Date();
  await prisma.revenueRecord.create({
    data: {
      organizationId: org.id,
      invoiceId: invoiceNexus.id,
      dealId: nexusDeal.id,
      accountId: accNexus.id,
      amount: 800000,
      type: 'ONE_TIME',
      recognizedDate: now,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
      notes: 'Initial Milestone Payment recognized for Nexus FinTech',
    },
  });

  // 12. Active Stalled / High Risk Discount Deal (Zenith Health Deal)
  const zenithDeal = await prisma.deal.create({
    data: {
      organizationId: org.id,
      accountId: accZenith.id,
      contactId: contactZenith.id,
      ownerId: rep.id,
      title: 'Zenith Diagnostics - Core Compute & Telemedicine Cloud',
      value: 950000,
      costTotal: 690000,
      marginPercent: 27.3,
      stage: 'APPROVAL_REQUIRED',
      probability: 65,
      expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      deliveryPromiseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Slippage alert
      lastActivityAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // Stalled alert (> 7 days)
    },
  });

  const quoteZenith = await prisma.quote.create({
    data: {
      organizationId: org.id,
      dealId: zenithDeal.id,
      version: 1,
      quoteNumber: 'QT-2026-0002-V1',
      status: 'PENDING_APPROVAL',
      subtotal: 1025000,
      costSubtotal: 730000,
      discountPercent: 18.0, // Exceeds Silver 10% ceiling -> requires Finance
      discountAmount: 184500,
      blendedRiskScore: 8.8,
      requiredApprovalRole: 'FINANCE',
      taxAmount: 151290,
      totalAmount: 991790,
      oneTimeTotal: 840500,
      recurringTotal: 151290,
      billingFrequency: 'MONTHLY',
      marginPercent: 26.4,
      notes: 'Client requesting aggressive 18% discount due to competitive multi-vendor RFP.',
      items: {
        create: [
          {
            productId: rackServer.id,
            quantity: 2,
            unitPrice: 420000,
            costPrice: 310000,
            discountPercent: 18.0,
            discountAmount: 151200,
            taxAmount: 123984,
            totalAmount: 812784,
            billingModel: 'ONE_TIME',
          },
          {
            productId: deploymentSvc.id,
            quantity: 1,
            unitPrice: 95000,
            costPrice: 75000,
            discountPercent: 18.0,
            discountAmount: 17100,
            taxAmount: 14022,
            totalAmount: 91922,
            billingModel: 'ONE_TIME',
          },
        ],
      },
    },
  });

  // Pending Approval for Zenith
  await prisma.approval.create({
    data: {
      organizationId: org.id,
      quoteId: quoteZenith.id,
      dealId: zenithDeal.id,
      requestedById: rep.id,
      approverRole: 'FINANCE',
      requestedDiscount: 18.0,
      thresholdDiscount: 10.0,
      riskScore: 8.8,
      reason: '18% discount requested on Server & Deployment exceeds Silver tier ceiling (10%). Blended Risk Score: 8.8.',
      status: 'PENDING',
    },
  });

  // 13. Audit Log Entries
  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: rep.id,
        action: 'DEAL_CREATED',
        entity: 'DEAL',
        entityId: nexusDeal.id,
        newState: JSON.stringify({ title: nexusDeal.title, value: nexusDeal.value }),
      },
      {
        organizationId: org.id,
        userId: rep.id,
        action: 'DISCOUNT_APPROVAL_REQUESTED',
        entity: 'QUOTE',
        entityId: quoteZenith.id,
        newState: JSON.stringify({ discountPercent: 18.0, blendedRiskScore: 8.8, requiredRole: 'FINANCE' }),
      },
      {
        organizationId: org.id,
        userId: manager.id,
        action: 'DISCOUNT_APPROVED',
        entity: 'APPROVAL',
        entityId: quote1.id,
        newState: JSON.stringify({ status: 'APPROVED', reason: 'Volume discount approved' }),
      },
      {
        organizationId: org.id,
        userId: legal.id,
        action: 'CONTRACT_LEGAL_APPROVED',
        entity: 'CONTRACT',
        entityId: contractNexus.id,
        newState: JSON.stringify({ status: 'APPROVED', legalReviewer: 'Ananya Deshmukh' }),
      },
      {
        organizationId: org.id,
        userId: finance.id,
        action: 'PAYMENT_RECEIVED',
        entity: 'PAYMENT',
        entityId: invoiceNexus.id,
        newState: JSON.stringify({ amount: 800000, invoiceStatus: 'PARTIALLY_PAID' }),
      },
    ],
  });

  // 14. Notifications
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: finance.id,
        title: 'High-Risk Discount Approval Required',
        message: `Rohan Verma submitted Quote ${quoteZenith.quoteNumber} with 18% discount (Risk Score: 8.8). Requires Finance sign-off.`,
        type: 'APPROVAL_REQUEST',
        entityType: 'QUOTE',
        entityId: quoteZenith.id,
      },
      {
        organizationId: org.id,
        userId: manager.id,
        title: 'Stalled Deal Alert: Zenith Diagnostics',
        message: 'Deal has been inactive for 9 days in stage APPROVAL_REQUIRED.',
        type: 'STALLED_DEAL',
        entityType: 'DEAL',
        entityId: zenithDeal.id,
      },
    ],
  });

  console.log('✅ Demo seed database completely populated!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
