const prisma = require('../config/db');
const { success, error } = require('../utils/responseHelper');
const { logAudit } = require('../services/auditLogService');
const { getUpsellRecommendations } = require('../services/pricingService');

// ----------------------------------------
// Products
// ----------------------------------------
const getProducts = async (req, res) => {
  try {
    const { category, billingModel, search } = req.query;
    const where = { organizationId: req.organizationId, isActive: true };

    if (category && category !== 'ALL') where.category = category;
    if (billingModel && billingModel !== 'ALL') where.billingModel = billingModel;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        plans: true,
        stockItems: { include: { warehouse: true } },
      },
      orderBy: { name: 'asc' },
    });

    const enriched = products.map((p) => {
      const totalStock = p.stockItems.reduce((acc, s) => acc + s.quantity, 0);
      const totalReserved = p.stockItems.reduce((acc, s) => acc + s.reservedQty, 0);
      return {
        ...p,
        totalStock,
        availableStock: Math.max(0, totalStock - totalReserved),
      };
    });

    return success(res, 'Products retrieved', enriched);
  } catch (err) {
    return error(res, 'Failed to fetch products', err.message, 500);
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      billingModel,
      basePrice,
      costPrice,
      unit,
      taxPercent,
      maxDiscountPercent,
      description,
      isPromoted,
      plans = [],
      initialStock = [], // [{ warehouseId, quantity }]
    } = req.body;

    if (!name || !code || !category || basePrice === undefined) {
      return error(res, 'Name, code, category, and base price are required', null, 400);
    }

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          organizationId: req.organizationId,
          name,
          code: code.toUpperCase().trim(),
          category,
          billingModel: billingModel || 'ONE_TIME',
          basePrice: parseFloat(basePrice),
          costPrice: parseFloat(costPrice || 0),
          unit: unit || 'Unit',
          taxPercent: taxPercent !== undefined ? parseFloat(taxPercent) : 18.0,
          maxDiscountPercent: maxDiscountPercent !== undefined ? parseFloat(maxDiscountPercent) : 15.0,
          description,
          isPromoted: Boolean(isPromoted),
          plans: {
            create: plans.map((pl) => ({
              name: pl.name,
              billingCycle: pl.billingCycle || 'MONTHLY',
              price: parseFloat(pl.price),
              setupFee: parseFloat(pl.setupFee || 0),
              description: pl.description,
            })),
          },
        },
        include: { plans: true },
      });

      // Initialize stock per warehouse
      if (initialStock.length) {
        for (const st of initialStock) {
          if (st.warehouseId) {
            await tx.stock.create({
              data: {
                productId: p.id,
                warehouseId: st.warehouseId,
                quantity: parseInt(st.quantity || 0, 10),
              },
            });
          }
        }
      }

      return p;
    });

    await logAudit({
      organizationId: req.organizationId,
      userId: req.user.id,
      action: 'PRODUCT_CREATED',
      entity: 'PRODUCT',
      entityId: product.id,
      newState: product,
    });

    return success(res, 'Product created successfully', product, 201);
  } catch (err) {
    return error(res, 'Failed to create product', err.message, 500);
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing || existing.organizationId !== req.organizationId) {
      return error(res, 'Product not found', null, 404);
    }

    const {
      name,
      code,
      category,
      billingModel,
      basePrice,
      costPrice,
      unit,
      taxPercent,
      maxDiscountPercent,
      description,
      isPromoted,
      isActive,
    } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase().trim() : undefined,
        category,
        billingModel,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        unit,
        taxPercent: taxPercent !== undefined ? parseFloat(taxPercent) : undefined,
        maxDiscountPercent: maxDiscountPercent !== undefined ? parseFloat(maxDiscountPercent) : undefined,
        description,
        isPromoted: isPromoted !== undefined ? Boolean(isPromoted) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: { plans: true, stockItems: true },
    });

    return success(res, 'Product updated successfully', updated);
  } catch (err) {
    return error(res, 'Failed to update product', err.message, 500);
  }
};

// ----------------------------------------
// Warehouses & Stock
// ----------------------------------------
const createWarehouse = async (req, res) => {
  try {
    const { name, code, location, shippingCostWeight, isMain } = req.body;
    if (!name || !code) {
      return error(res, 'Warehouse name and code are required', null, 400);
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        organizationId: req.organizationId,
        name,
        code: code.toUpperCase().trim(),
        location,
        shippingCostWeight: shippingCostWeight ? parseFloat(shippingCostWeight) : 1.0,
        isMain: Boolean(isMain),
      },
    });

    return success(res, 'Warehouse created successfully', warehouse, 201);
  } catch (err) {
    return error(res, 'Failed to create warehouse', err.message, 500);
  }
};

const getWarehouses = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId: req.organizationId },
      include: {
        stockItems: {
          include: { product: true },
        },
      },
      orderBy: { isMain: 'desc' },
    });

    return success(res, 'Warehouses retrieved', warehouses);
  } catch (err) {
    return error(res, 'Failed to fetch warehouses', err.message, 500);
  }
};

const updateStockLevel = async (req, res) => {
  try {
    const { warehouseId, productId, quantity, minReplenishQty } = req.body;

    const stock = await prisma.stock.upsert({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      update: {
        quantity: parseInt(quantity, 10),
        minReplenishQty: minReplenishQty !== undefined ? parseInt(minReplenishQty, 10) : undefined,
      },
      create: {
        productId,
        warehouseId,
        quantity: parseInt(quantity, 10),
        minReplenishQty: minReplenishQty !== undefined ? parseInt(minReplenishQty, 10) : 10,
      },
      include: { product: true, warehouse: true },
    });

    return success(res, 'Stock level updated', stock);
  } catch (err) {
    return error(res, 'Failed to update stock', err.message, 500);
  }
};

// ----------------------------------------
// Upsell Recommendations
// ----------------------------------------
const getUpsells = async (req, res) => {
  try {
    const { productIds } = req.query;
    const ids = productIds ? productIds.split(',') : [];
    const recommendations = await getUpsellRecommendations({
      organizationId: req.organizationId,
      productIds: ids,
    });
    return success(res, 'Upsell recommendations', recommendations);
  } catch (err) {
    return error(res, 'Failed to fetch upsells', err.message, 500);
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  createWarehouse,
  getWarehouses,
  updateStockLevel,
  getUpsells,
};
