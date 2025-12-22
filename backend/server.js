import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';

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

  input ShopifyCredentialInput {
    clientId: String!
    storeDomain: String!
    accessToken: String!
    apiVersion: String
  }

  type Query {
    health: String!
  }

  type Mutation {
    testShopifyConnection(input: ShopifyCredentialInput!): ShopifyConnectionResult!
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

const resolvers = {
  Query: {
    health: () => 'ok',
  },
  Mutation: {
    testShopifyConnection: async (_, { input }) => {
      return testConnection(input);
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
