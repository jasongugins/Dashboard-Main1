import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const typeDefs = `#graphql
  type ShopifyCredential {
    id: ID!
    clientId: String!
    storeDomain: String!
    apiVersion: String!
    createdAt: String!
    updatedAt: String!
  }

  type ShopifyConnectionResult {
    ok: Boolean!
    message: String
    shopName: String
    domain: String
  }

  type SyncResult {
    ok: Boolean!
    message: String
    products: Int!
    variants: Int!
    orders: Int!
    lineItems: Int!
    lastCursor: String
    hasMore: Boolean
  }

  type DashboardMetrics {
    totalRevenue: Float!
    totalOrders: Int!
    averageOrderValue: Float!
    totalProducts: Int!
  }

  type SalesPoint {
    date: String!
    revenue: Float!
    orders: Int!
  }

  type ProfitMetrics {
    revenue: Float!
    cost: Float!
    profit: Float!
    marginPct: Float!
  }

  type SkuPerformance {
    productId: ID!
    name: String!
    unitsSold: Int!
    revenue: Float!
    cost: Float!
    profit: Float!
    marginPct: Float!
  }

  input ShopifyCredentialInput {
    clientId: String!
    storeDomain: String!
    accessToken: String!
    apiVersion: String
  }

  input SyncInput {
    clientId: String!
    startDate: String
    endDate: String
  }

  input DashboardInput {
    clientId: String!
    startDate: String
    endDate: String
  }

  input ProfitInput {
    clientId: String!
    startDate: String
    endDate: String
  }

  input SkuPerformanceInput {
    clientId: String!
    startDate: String
    endDate: String
    sortBy: String
    sortDir: String
  }

  type Query {
    health: String!
    getDashboardMetrics(input: DashboardInput!): DashboardMetrics!
    getSalesChartData(input: DashboardInput!): [SalesPoint!]!
    getProfitMetrics(input: ProfitInput!): ProfitMetrics!
    getSkuPerformance(input: SkuPerformanceInput!): [SkuPerformance!]!
  }

  type Mutation {
    testShopifyConnection(input: ShopifyCredentialInput!): ShopifyConnectionResult!
    syncShopifyData(input: SyncInput!): SyncResult!
    saveShopifyCredentials(input: ShopifyCredentialInput!): ShopifyConnectionResult!
  }
`;

const normalizeStoreDomain = (domain) => {
  if (!domain) return '';
  const trimmed = domain.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return trimmed.toLowerCase();
};

const buildShopifyUrl = (storeDomain, apiVersion) => {
  const domain = normalizeStoreDomain(storeDomain);
  const version = apiVersion || '2024-10';
  return { endpoint: `https://${domain}/admin/api/${version}/graphql.json`, domain, version };
};

const testConnection = async ({ clientId, storeDomain, accessToken, apiVersion }) => {
  const { endpoint, domain, version } = buildShopifyUrl(storeDomain, apiVersion);

  const shopQuery = `query ShopInfo { shop { name myshopifyDomain } }`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: shopQuery }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      return {
        ok: false,
        message: `Shopify responded with ${response.status}: ${bodyText}`,
      };
    }

    const payload = await response.json();

    if (payload.errors && payload.errors.length > 0) {
      const msg = payload.errors.map((e) => e.message).join('; ');
      return { ok: false, message: `Shopify error: ${msg}` };
    }

    const shop = payload.data?.shop;
    if (!shop) {
      return { ok: false, message: 'No shop data returned from Shopify' };
    }

    await prisma.shopifyCredential.upsert({
      where: { clientId },
      update: {
        storeDomain: domain,
        accessToken,
        apiVersion: version,
      },
      create: {
        clientId,
        storeDomain: domain,
        accessToken,
        apiVersion: version,
      },
    });

    return {
      ok: true,
      message: 'Connection successful',
      shopName: shop.name,
      domain: shop.myshopifyDomain || domain,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Request failed: ${error.message}`,
    };
  }
};

const saveShopifyCredentials = async ({ clientId, storeDomain, accessToken, apiVersion }) => {
  const result = await testConnection({ clientId, storeDomain, accessToken, apiVersion });
  return result;
};

const SHOPIFY_PRODUCT_QUERY = `#graphql
  query Products($cursor: String) {
    products(first: 100, after: $cursor) {
      edges {
        cursor
        node {
          id
          title
          handle
          vendor
          productType
          status
          updatedAt
          createdAt
          variants(first: 100) {
            edges {
              node {
                id
                title
                sku
                barcode
                price
                compareAtPrice
                inventoryQuantity
                inventoryItem { id unitCost { amount currencyCode } }
                updatedAt
                createdAt
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const SHOPIFY_ORDER_QUERY = `#graphql
  query Orders($cursor: String, $query: String) {
    orders(first: 250, after: $cursor, query: $query) {
      edges {
        cursor
        node {
          id
          name
          processedAt
          updatedAt
          currencyCode
          totalPriceSet { presentmentMoney { amount } }
          currentSubtotalPriceSet { presentmentMoney { amount } }
          currentTotalDiscountsSet { presentmentMoney { amount } }
          currentTotalTaxSet { presentmentMoney { amount } }
          currentTotalPriceSet { presentmentMoney { amount } }
          displayFinancialStatus
          discountApplications(first: 5) {
            edges {
              node {
                ... on DiscountCodeApplication {
                  code
                }
                value {
                  ... on MoneyV2 { amount }
                }
              }
            }
          }
          shippingLines(first: 1) {
            edges {
              node {
                title
                originalPriceSet { shopMoney { amount } }
              }
            }
          }
          lineItems(first: 100) {
            edges {
              node {
                id
                title
                product { id }
                variant { id sku title }
                quantity
                originalUnitPriceSet { presentmentMoney { amount } }
                totalDiscountSet { presentmentMoney { amount } }
                discountedTotalSet { presentmentMoney { amount } }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const shopifyRequest = async (credential, query, variables) => {
  const { endpoint } = buildShopifyUrl(credential.storeDomain, credential.apiVersion);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': credential.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify ${response.status}: ${body}`);
  }
  const payload = await response.json();
  if (payload.errors && payload.errors.length) {
    throw new Error(payload.errors.map((e) => e.message).join('; '));
  }
  return payload.data;
};

const dec = (value) => new Prisma.Decimal(value || 0);
const money = (set) => dec(set?.presentmentMoney?.amount || 0);
const toNumber = (value) => (value instanceof Prisma.Decimal ? value.toNumber() : Number(value || 0));
const paidStatuses = ['paid', 'partially_paid'];
const withPaidStatus = (where) => ({
  ...where,
  financialStatus: { in: paidStatuses },
});

const withinDates = (startDate, endDate) => {
  const where = {};
  if (startDate || endDate) {
    where.processedAt = {};
    if (startDate) where.processedAt.gte = new Date(startDate);
    if (endDate) {
      // Add 1 day and use lt (strictly less than) to include full day
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.processedAt.lt = nextDay;
    }
  }
  return where;
};

const syncProducts = async (credential) => {
  let cursor = null;
  let hasMore = true;
  let productCount = 0;
  let variantCount = 0;
  let isFirstPage = true;

  while (hasMore) {
    const data = await shopifyRequest(credential, SHOPIFY_PRODUCT_QUERY, { cursor });
    const connection = data?.products;
    
    // Safety valve: If first API call returns null/undefined, abort entirely
    if (!connection) {
      if (isFirstPage) {
        throw new Error('Shopify API returned no product data. Sync aborted to protect existing data.');
      }
      break;
    }
    isFirstPage = false;

    for (const edge of connection.edges || []) {
      const p = edge.node;
      const productRecord = await prisma.product.upsert({
        where: { shopifyId: p.id },
        update: {
          title: p.title,
          handle: p.handle || null,
          vendor: p.vendor || null,
          productType: p.productType || null,
          status: p.status || null,
          tags: null,
          updatedAt: new Date(p.updatedAt),
          clientId: credential.clientId,
          credentialId: credential.id,
        },
        create: {
          shopifyId: p.id,
          clientId: credential.clientId,
          credentialId: credential.id,
          title: p.title,
          handle: p.handle || null,
          vendor: p.vendor || null,
          productType: p.productType || null,
          status: p.status || null,
          tags: null,
          updatedAt: new Date(p.updatedAt),
        },
      });
      productCount += 1;

      for (const vEdge of p.variants?.edges || []) {
        const v = vEdge.node;
        await prisma.variant.upsert({
          where: { shopifyId: v.id },
          update: {
            productId: productRecord.id,
            sku: v.sku || null,
            title: v.title || null,
            barcode: v.barcode || null,
            price: v.price != null ? dec(v.price) : null,
            compareAtPrice: v.compareAtPrice != null ? dec(v.compareAtPrice) : null,
            inventoryCost: v.inventoryItem?.unitCost?.amount != null ? dec(v.inventoryItem.unitCost.amount) : null,
            inventoryQuantity: v.inventoryQuantity ?? null,
            inventoryItemId: v.inventoryItem?.id || null,
            updatedAt: new Date(v.updatedAt),
          },
          create: {
            shopifyId: v.id,
            productId: productRecord.id,
            sku: v.sku || null,
            title: v.title || null,
            barcode: v.barcode || null,
            price: v.price != null ? dec(v.price) : null,
            compareAtPrice: v.compareAtPrice != null ? dec(v.compareAtPrice) : null,
            inventoryCost: v.inventoryItem?.unitCost?.amount != null ? dec(v.inventoryItem.unitCost.amount) : null,
            inventoryQuantity: v.inventoryQuantity ?? null,
            inventoryItemId: v.inventoryItem?.id || null,
            updatedAt: new Date(v.updatedAt),
          },
        });
        variantCount += 1;
      }
    }

    hasMore = connection.pageInfo?.hasNextPage;
    cursor = connection.pageInfo?.endCursor;
  }

  return { productCount, variantCount, lastCursor: cursor, hasMore };
};

const buildOrderQueryString = (startDate, endDate) => {
  const parts = [];
  if (startDate) parts.push(`created_at:>=${startDate}`);
  if (endDate) parts.push(`created_at:<=${endDate}`);
  return parts.join(' ');
};

const syncOrders = async (credential, startDate, endDate) => {
  let cursor = null;
  let hasMore = true;
  let orders = 0;
  let lineItems = 0;
  let isFirstPage = true;
  const queryString = buildOrderQueryString(startDate, endDate) || undefined;

  const variantCostMap = new Map();
  const variants = await prisma.variant.findMany({ where: { product: { clientId: credential.clientId } } });
  variants.forEach((v) => variantCostMap.set(v.shopifyId, v.inventoryCost || dec(0)));

  while (hasMore) {
    const data = await shopifyRequest(credential, SHOPIFY_ORDER_QUERY, { cursor, query: queryString });
    const connection = data?.orders;
    
    // Safety valve: If first API call returns null/undefined, abort entirely
    if (!connection) {
      if (isFirstPage) {
        throw new Error('Shopify API returned no order data. Sync aborted to protect existing data.');
      }
      break;
    }
    isFirstPage = false;

    for (const edge of connection.edges || []) {
      const o = edge.node;
      const subtotal = money(o.currentSubtotalLineItemsSet);
      const totalPrice = money(o.currentTotalPriceSet);
      const totalDiscounts = money(o.currentTotalDiscountsSet);
      const totalShipping = money(o.currentTotalShippingPriceSet);
      const totalTax = money(o.currentTotalTaxSet);
      const netPayment = totalPrice.minus(totalDiscounts).plus(totalShipping).minus(totalTax);

      const orderRecord = await prisma.order.upsert({
        where: { shopifyId: o.id },
        update: {
          clientId: credential.clientId,
          credentialId: credential.id,
          name: o.name,
          currency: o.currencyCode,
          subtotal,
          totalPrice,
          totalDiscounts,
          totalShipping,
          totalTax,
          netPayment,
          fulfillmentStatus: null,
          financialStatus: o.displayFinancialStatus ? String(o.displayFinancialStatus).toLowerCase() : null,
          processedAt: new Date(o.processedAt),
          updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(o.processedAt),
          orderNumber: o.name ? parseInt(o.name.replace(/[^0-9]/g, ''), 10) || null : null,
          customerId: null,
          discountCodes: o.discountCodes ? JSON.stringify(o.discountCodes) : null,
          shippingLines: o.shippingLines ? JSON.stringify(o.shippingLines) : null,
        },
        create: {
          shopifyId: o.id,
          clientId: credential.clientId,
          credentialId: credential.id,
          name: o.name,
          currency: o.currencyCode,
          subtotal,
          totalPrice,
          totalDiscounts,
          totalShipping,
          totalTax,
          netPayment,
          fulfillmentStatus: null,
          financialStatus: o.displayFinancialStatus ? String(o.displayFinancialStatus).toLowerCase() : null,
          processedAt: new Date(o.processedAt),
          updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(o.processedAt),
          orderNumber: o.name ? parseInt(o.name.replace(/[^0-9]/g, ''), 10) || null : null,
          customerId: null,
          discountCodes: o.discountCodes ? JSON.stringify(o.discountCodes) : null,
          shippingLines: o.shippingLines ? JSON.stringify(o.shippingLines) : null,
        },
      });
      orders += 1;

      let orderLandingCost = dec(0);

      for (const liEdge of o.lineItems?.edges || []) {
        const li = liEdge.node;
        const variantId = li.variant?.id || null;
        const variantCost = variantId ? variantCostMap.get(variantId) || dec(0) : dec(0);
        const landingCost = variantCost.mul(li.quantity || 0);
        orderLandingCost = orderLandingCost.plus(landingCost);

        await prisma.lineItem.upsert({
          where: { shopifyId: li.id },
          update: {
            orderId: orderRecord.id,
            productId: li.product?.id || null,
            variantId: variantId || null,
            title: li.variant?.title || li.title || 'Line Item',
            sku: li.variant?.sku || null,
            quantity: li.quantity,
            price: money(li.originalUnitPriceSet),
            totalDiscount: money(li.totalDiscountSet),
            discountedTotal: li.discountedTotalSet ? money(li.discountedTotalSet) : null,
            fulfillmentStatus: li.fulfillmentStatus || null,
            landingCost,
            netPayment: money(li.discountedTotalSet || li.originalUnitPriceSet),
          },
          create: {
            shopifyId: li.id,
            orderId: orderRecord.id,
            productId: li.product?.id || null,
            variantId: variantId || null,
            title: li.variant?.title || li.title || 'Line Item',
            sku: li.variant?.sku || null,
            quantity: li.quantity,
            price: money(li.originalUnitPriceSet),
            totalDiscount: money(li.totalDiscountSet),
            discountedTotal: li.discountedTotalSet ? money(li.discountedTotalSet) : null,
            fulfillmentStatus: li.fulfillmentStatus || null,
            landingCost,
            netPayment: money(li.discountedTotalSet || li.originalUnitPriceSet),
          },
        });
        lineItems += 1;
      }

      await prisma.order.update({
        where: { id: orderRecord.id },
        data: { landingCost: orderLandingCost },
      });
    }

    hasMore = connection.pageInfo?.hasNextPage;
    cursor = connection.pageInfo?.endCursor;
  }

  return { orders, lineItems, lastCursor: cursor, hasMore };
};

// Pre-sync health check: verify Shopify API is reachable
const verifyShopifyConnection = async (credential) => {
  const { endpoint } = buildShopifyUrl(credential.storeDomain, credential.apiVersion);
  const healthQuery = `query { shop { name } }`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': credential.accessToken,
      },
      body: JSON.stringify({ query: healthQuery }),
    });
    
    if (!response.ok) {
      return { ok: false, message: `Shopify API returned ${response.status}` };
    }
    
    const payload = await response.json();
    if (payload.errors?.length) {
      return { ok: false, message: payload.errors[0].message };
    }
    
    if (!payload.data?.shop?.name) {
      return { ok: false, message: 'Invalid response from Shopify API' };
    }
    
    return { ok: true };
  } catch (err) {
    return { ok: false, message: `Connection failed: ${err.message}` };
  }
};

const syncShopifyData = async ({ clientId, startDate, endDate }) => {
  const credential = await prisma.shopifyCredential.findUnique({ where: { clientId } });
  if (!credential) {
    return { ok: false, message: 'No credential found for client', products: 0, variants: 0, orders: 0, lineItems: 0 };
  }

  // Safety valve #1: Verify Shopify is reachable before syncing
  const healthCheck = await verifyShopifyConnection(credential);
  if (!healthCheck.ok) {
    console.warn(`[Sync Safety] Aborting sync for ${clientId}: ${healthCheck.message}`);
    return { 
      ok: false, 
      message: `Sync aborted - API unreachable: ${healthCheck.message}. Existing data preserved.`,
      products: 0, variants: 0, orders: 0, lineItems: 0 
    };
  }

  // Safety valve #2: Get current counts to compare after sync
  const beforeCounts = {
    products: await prisma.product.count({ where: { clientId } }),
    orders: await prisma.order.count({ where: { clientId } }),
  };

  try {
    const productResult = await syncProducts(credential);
    const orderResult = await syncOrders(credential, startDate, endDate);

    // Safety valve #3: Warn if sync resulted in significantly fewer records
    const afterCounts = {
      products: await prisma.product.count({ where: { clientId } }),
      orders: await prisma.order.count({ where: { clientId } }),
    };
    
    if (beforeCounts.orders > 0 && afterCounts.orders === 0) {
      console.warn(`[Sync Safety] Warning: Orders went from ${beforeCounts.orders} to 0 for ${clientId}`);
    }

    return {
      ok: true,
      message: 'Sync completed',
      products: productResult.productCount,
      variants: productResult.variantCount,
      orders: orderResult.orders,
      lineItems: orderResult.lineItems,
      lastCursor: orderResult.lastCursor,
      hasMore: orderResult.hasMore,
    };
  } catch (error) {
    // Safety valve #4: On error, existing data is preserved (upsert doesn't delete)
    console.error(`[Sync Safety] Sync failed for ${clientId}: ${error.message}. Existing data preserved.`);
    return {
      ok: false,
      message: `Sync failed: ${error.message}. Existing data preserved.`,
      products: 0,
      variants: 0,
      orders: 0,
      lineItems: 0,
    };
  }
};

const getDashboardMetrics = async ({ clientId, startDate, endDate }) => {
  const dateWhere = withinDates(startDate, endDate);
  const where = withPaidStatus({ clientId, ...dateWhere });

  console.log("---------------- DEBUG X-RAY ----------------");
  console.log("Incoming Dates:", { startDate, endDate });
  console.log("Generated WHERE Clause:", JSON.stringify(where, null, 2));
  const allOrdersForClient = await prisma.order.findMany({
    where: { clientId },
    select: { id: true, processedAt: true, financialStatus: true, totalPrice: true },
    orderBy: { processedAt: 'desc' },
    take: 10,
  });
  console.log("Recent Orders in DB for clientId:", clientId);
  allOrdersForClient.forEach(o => console.log(`  id=${o.id} processed=${o.processedAt.toISOString()} status=${o.financialStatus} total=${o.totalPrice}`));
  console.log("---------------------------------------------");

  const revenueAgg = await prisma.order.aggregate({ where, _sum: { totalPrice: true }, _count: { _all: true } });
  const totalRevenue = toNumber(revenueAgg._sum.totalPrice);
  const totalOrders = revenueAgg._count._all || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalProducts = await prisma.product.count({ where: { clientId } });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalProducts,
  };
};

const getSalesChartData = async ({ clientId, startDate, endDate }) => {
  const dateWhere = withinDates(startDate, endDate);
  const orders = await prisma.order.findMany({
    where: withPaidStatus({ clientId, ...dateWhere }),
    select: { processedAt: true, totalPrice: true },
    orderBy: { processedAt: 'asc' },
  });

  const byDay = new Map();
  for (const o of orders) {
    const day = o.processedAt.toISOString().slice(0, 10);
    const entry = byDay.get(day) || { revenue: 0, orders: 0 };
    entry.revenue += toNumber(o.totalPrice);
    entry.orders += 1;
    byDay.set(day, entry);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }));
};

const getProfitMetrics = async ({ clientId, startDate, endDate }) => {
  const dateWhere = withinDates(startDate, endDate);
  const orderWhere = withPaidStatus({ clientId, ...dateWhere });

  const revenueAgg = await prisma.order.aggregate({ where: orderWhere, _sum: { totalPrice: true } });
  const revenue = toNumber(revenueAgg._sum.totalPrice);

  const lineItems = await prisma.lineItem.findMany({
    where: {
      order: withPaidStatus({ clientId, ...dateWhere }),
    },
    select: { landingCost: true },
  });
  const cost = lineItems.reduce((acc, li) => acc + toNumber(li.landingCost), 0);
  const profit = revenue - cost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, cost, profit, marginPct };
};

const getSkuPerformance = async ({ clientId, startDate, endDate, sortBy, sortDir }) => {
  const dateWhere = withinDates(startDate, endDate);
  const items = await prisma.lineItem.findMany({
    where: {
      order: withPaidStatus({ clientId, ...dateWhere }),
    },
    select: {
      productId: true,
      title: true,
      quantity: true,
      price: true,
      totalDiscount: true,
      discountedTotal: true,
      landingCost: true,
    },
  });

  const products = await prisma.product.findMany({ where: { clientId } });
  const nameByProductId = new Map(products.map((p) => [p.shopifyId, p.title]));

  const agg = new Map();
  for (const li of items) {
    const id = li.productId || 'unknown';
    const prev = agg.get(id) || { unitsSold: 0, revenue: 0, cost: 0, name: nameByProductId.get(id) || li.title || 'Unknown SKU' };
    const revenue = li.discountedTotal ? toNumber(li.discountedTotal) : toNumber(li.price) - toNumber(li.totalDiscount);
    const cost = toNumber(li.landingCost);
    prev.unitsSold += li.quantity || 0;
    prev.revenue += revenue;
    prev.cost += cost;
    agg.set(id, prev);
  }

  const rows = Array.from(agg.entries()).map(([productId, v]) => {
    const profit = v.revenue - v.cost;
    const marginPct = v.revenue > 0 ? (profit / v.revenue) * 100 : 0;
    return { productId, name: v.name, unitsSold: v.unitsSold, revenue: v.revenue, cost: v.cost, profit, marginPct };
  });

  const sortKey = sortBy && ['profit', 'marginPct', 'revenue', 'unitsSold'].includes(sortBy) ? sortBy : 'profit';
  const dir = sortDir === 'asc' ? 1 : -1;
  rows.sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === bv) return 0;
    return av > bv ? dir : -dir;
  });

  return rows;
};

const resolvers = {
  Query: {
    health: () => 'ok',
    getDashboardMetrics: async (_, { input }) => getDashboardMetrics(input),
    getSalesChartData: async (_, { input }) => getSalesChartData(input),
    getProfitMetrics: async (_, { input }) => getProfitMetrics(input),
    getSkuPerformance: async (_, { input }) => getSkuPerformance(input),
  },
  Mutation: {
    testShopifyConnection: async (_, { input }) => {
      return testConnection(input);
    },
    syncShopifyData: async (_, { input }) => {
      return syncShopifyData(input);
    },
    saveShopifyCredentials: async (_, { input }) => {
      return saveShopifyCredentials(input);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const PORT = Number(process.env.PORT) || 4000;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT },
  context: async () => ({ prisma }),
});

console.log(`🚀 Shopify middleware ready at ${url}`);

// ==================== AUTO-SYNC CRON JOB ====================
const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS) || 15 * 60 * 1000; // Default: 15 minutes
const AUTO_SYNC_ENABLED = process.env.AUTO_SYNC_ENABLED !== 'false'; // Default: enabled

const syncAllClients = async () => {
  const startTime = Date.now();
  console.log('\n🔄 [Auto-Sync] Starting sync for all clients...');
  
  try {
    const credentials = await prisma.shopifyCredential.findMany({
      select: { clientId: true, storeDomain: true },
    });

    if (credentials.length === 0) {
      console.log('🔄 [Auto-Sync] No clients found to sync.');
      return;
    }

    console.log(`🔄 [Auto-Sync] Found ${credentials.length} client(s) to sync.`);

    for (const cred of credentials) {
      console.log(`🔄 [Auto-Sync] Syncing "${cred.clientId}" (${cred.storeDomain})...`);
      try {
        const result = await syncShopifyData({ clientId: cred.clientId });
        if (result.ok) {
          console.log(`   ✅ ${cred.clientId}: ${result.products} products, ${result.orders} orders synced.`);
        } else {
          console.log(`   ⚠️ ${cred.clientId}: ${result.message}`);
        }
      } catch (err) {
        console.error(`   ❌ ${cred.clientId}: ${err.message}`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🔄 [Auto-Sync] Completed in ${elapsed}s. Next sync in ${SYNC_INTERVAL_MS / 60000} minutes.\n`);
  } catch (err) {
    console.error('🔄 [Auto-Sync] Fatal error:', err.message);
  }
};

let syncIntervalId = null;

if (AUTO_SYNC_ENABLED) {
  // Run initial sync after 10 seconds (let server fully start)
  setTimeout(() => {
    syncAllClients();
    // Then schedule recurring syncs
    syncIntervalId = setInterval(syncAllClients, SYNC_INTERVAL_MS);
  }, 10000);
  console.log(`⏰ Auto-sync enabled. Interval: ${SYNC_INTERVAL_MS / 60000} minutes.`);
} else {
  console.log('⏰ Auto-sync disabled (set AUTO_SYNC_ENABLED=true to enable).');
}
// ============================================================

const shutdown = async () => {
  if (syncIntervalId) clearInterval(syncIntervalId);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
