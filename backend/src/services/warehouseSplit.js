const prisma = require('../config/db');

/**
 * Multi-warehouse inventory fulfillment splitting engine.
 * Automatically analyzes stock across warehouses and suggests an optimal split
 * to fulfill required product quantities with minimum shipments and lowest cost weighting.
 */
const calculateWarehouseSplit = async ({ organizationId, items = [] }) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId },
    include: {
      stockItems: true,
    },
    orderBy: [{ isMain: 'desc' }, { shippingCostWeight: 'asc' }],
  });

  if (!warehouses.length) {
    return { splits: [], backorders: items.map((i) => ({ productId: i.productId, qty: i.quantity })) };
  }

  const splitAllocations = [];
  const backorders = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || product.category === 'SERVICES' || product.billingModel === 'RECURRING') {
      // Digital or services don't require physical warehouse allocation
      continue;
    }

    let remainingQtyToFulfill = item.quantity;
    const itemSplits = [];

    // First try main warehouse, then nearest depot
    for (const warehouse of warehouses) {
      if (remainingQtyToFulfill <= 0) break;

      const stockRecord = warehouse.stockItems.find((s) => s.productId === item.productId);
      const availableStock = stockRecord ? Math.max(0, stockRecord.quantity - stockRecord.reservedQty) : 0;

      if (availableStock > 0) {
        const allocatedQty = Math.min(remainingQtyToFulfill, availableStock);
        remainingQtyToFulfill -= allocatedQty;

        itemSplits.push({
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          warehouseLocation: warehouse.location,
          productId: item.productId,
          productName: product.name,
          allocatedQty,
          shippingCostWeight: warehouse.shippingCostWeight,
          estimatedShipmentCost: allocatedQty * 250 * warehouse.shippingCostWeight,
        });
      }
    }

    if (remainingQtyToFulfill > 0) {
      backorders.push({
        productId: item.productId,
        productName: product.name,
        backorderQty: remainingQtyToFulfill,
        reason: 'Insufficient stock across active warehouses. Replenishment PO recommended.',
      });
    }

    splitAllocations.push({
      productId: item.productId,
      productName: product.name,
      requestedQty: item.quantity,
      fulfilledQty: item.quantity - remainingQtyToFulfill,
      splits: itemSplits,
    });
  }

  // Calculate shipment summaries
  const warehouseShipmentSummary = {};
  for (const alloc of splitAllocations) {
    for (const split of alloc.splits) {
      if (!warehouseShipmentSummary[split.warehouseId]) {
        warehouseShipmentSummary[split.warehouseId] = {
          warehouseId: split.warehouseId,
          warehouseName: split.warehouseName,
          itemsCount: 0,
          totalUnits: 0,
          estimatedCost: 0,
        };
      }
      warehouseShipmentSummary[split.warehouseId].itemsCount += 1;
      warehouseShipmentSummary[split.warehouseId].totalUnits += split.allocatedQty;
      warehouseShipmentSummary[split.warehouseId].estimatedCost += split.estimatedShipmentCost;
    }
  }

  const totalShipments = Object.keys(warehouseShipmentSummary).length;
  const totalShippingCost = Object.values(warehouseShipmentSummary).reduce((acc, w) => acc + w.estimatedCost, 0);

  return {
    splitAllocations,
    warehouseShipments: Object.values(warehouseShipmentSummary),
    totalShipments,
    totalShippingCost: Number(totalShippingCost.toFixed(2)),
    backorders,
    hasBackorders: backorders.length > 0,
  };
};

/**
 * Commits stock reservation upon quotation approval/confirmation.
 */
const reserveFulfillmentStock = async ({ organizationId, quoteItems = [] }) => {
  for (const item of quoteItems) {
    if (item.warehouseId && item.quantity > 0) {
      await prisma.stock.updateMany({
        where: {
          productId: item.productId,
          warehouseId: item.warehouseId,
        },
        data: {
          reservedQty: {
            increment: item.quantity,
          },
        },
      });
    }
  }
};

module.exports = {
  calculateWarehouseSplit,
  reserveFulfillmentStock,
};
