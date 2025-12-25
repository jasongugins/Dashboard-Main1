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

  type Query {
    health: String!
  }

  type Mutation {
    testShopifyConnection(input: ShopifyCredentialInput!): ShopifyConnectionResult!
    syncShopifyData(input: SyncInput!): SyncResult!
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
    orders(first: 50, after: $cursor, query: $query) {
      edges {
        cursor
        node {
          id
          name
          processedAt
          updatedAt
          currencyCode
          totalPriceSet { presentmentMoney { amount } }
          currentSubtotalLineItemsSet { presentmentMoney { amount } }
          currentTotalDiscountsSet { presentmentMoney { amount } }
          currentTotalTaxSet { presentmentMoney { amount } }
          currentTotalShippingPriceSet { presentmentMoney { amount } }
          currentTotalPriceSet { presentmentMoney { amount } }
          financialStatus
          fulfillmentStatus
          discountCodes { code amount }
          shippingLines { title priceSet { presentmentMoney { amount } } }
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
                fulfillmentStatus
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

const syncProducts = async (credential) => {
  let cursor = null;
  let hasMore = true;
  let productCount = 0;
  let variantCount = 0;

  while (hasMore) {
    const data = await shopifyRequest(credential, SHOPIFY_PRODUCT_QUERY, { cursor });
    const connection = data?.products;
    if (!connection) break;

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
  const queryString = buildOrderQueryString(startDate, endDate) || undefined;

  const variantCostMap = new Map();
  const variants = await prisma.variant.findMany({ where: { product: { clientId: credential.clientId } } });
  variants.forEach((v) => variantCostMap.set(v.shopifyId, v.inventoryCost || dec(0)));

  while (hasMore) {
    const data = await shopifyRequest(credential, SHOPIFY_ORDER_QUERY, { cursor, query: queryString });
    const connection = data?.orders;
    if (!connection) break;

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
          fulfillmentStatus: o.fulfillmentStatus || null,
          financialStatus: o.financialStatus || null,
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
          fulfillmentStatus: o.fulfillmentStatus || null,
          financialStatus: o.financialStatus || null,
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

const syncShopifyData = async ({ clientId, startDate, endDate }) => {
  const credential = await prisma.shopifyCredential.findUnique({ where: { clientId } });
  if (!credential) {
    return { ok: false, message: 'No credential found for client', products: 0, variants: 0, orders: 0, lineItems: 0 };
  }

  try {
    const productResult = await syncProducts(credential);
    const orderResult = await syncOrders(credential, startDate, endDate);

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
    return {
      ok: false,
      message: error.message,
      products: 0,
      variants: 0,
      orders: 0,
      lineItems: 0,
    };
  }
};

const resolvers = {
  Query: {
    health: () => 'ok',
  },
  Mutation: {
    testShopifyConnection: async (_, { input }) => {
      return testConnection(input);
    },
    syncShopifyData: async (_, { input }) => {
      return syncShopifyData(input);
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

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
