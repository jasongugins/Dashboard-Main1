import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const dec = (v) => new Prisma.Decimal(v);

const randomFloat = (min, max, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
};

const productTemplates = [
  { title: 'Performance Leggings', handle: 'leggings', vendor: 'GymShark', productType: 'Apparel' },
  { title: 'Travel Backpack', handle: 'backpack', vendor: 'Nomad', productType: 'Gear' },
  { title: 'Vitamin C Serum', handle: 'vitamin-c', vendor: 'Aurora', productType: 'Beauty' },
  { title: 'Carbon Steel Skillet', handle: 'skillet', vendor: 'Forge', productType: 'Kitchen' },
  { title: 'Noise Canceling Buds', handle: 'buds', vendor: 'Tone', productType: 'Electronics' },
  { title: 'Merino Tee', handle: 'tee', vendor: 'Wooly', productType: 'Apparel' },
  { title: 'Smart Lamp', handle: 'lamp', vendor: 'Lumos', productType: 'Home' },
  { title: 'Running Shoes', handle: 'shoes', vendor: 'Stride', productType: 'Footwear' },
  { title: 'Hydration Bottle', handle: 'bottle', vendor: 'Flow', productType: 'Accessories' },
  { title: 'Massage Gun', handle: 'massage-gun', vendor: 'Recover', productType: 'Wellness' },
];

const createProducts = async (clientId) => {
  const products = [];
  for (let i = 0; i < 10; i++) {
    const tpl = productTemplates[i % productTemplates.length];
    const price = randomFloat(40, 180, 2);
    const cost = randomFloat(price * 0.2, price * 0.5, 2);
    const product = await prisma.product.create({
      data: {
        shopifyId: `gid://shopify/Product/${1000 + i}`,
        clientId,
        title: tpl.title,
        handle: tpl.handle,
        vendor: tpl.vendor,
        productType: tpl.productType,
        status: 'active',
        updatedAt: new Date(),
      },
    });
    await prisma.variant.create({
      data: {
        shopifyId: `gid://shopify/ProductVariant/${2000 + i}`,
        productId: product.id,
        sku: `${tpl.handle}-sku-${i}`,
        title: `${tpl.title} Variant`,
        price: dec(price),
        compareAtPrice: dec(price * 1.1),
        inventoryCost: dec(cost),
        inventoryQuantity: 500,
        updatedAt: new Date(),
      },
    });
    products.push({ product, price, cost });
  }
  return products;
};

const createOrders = async (clientId, products) => {
  const today = new Date();
  let orders = 0;
  let lineItems = 0;
  for (let i = 0; i < 55; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const processedAt = new Date(today);
    processedAt.setDate(today.getDate() - daysAgo);

    const itemsInOrder = 1 + Math.floor(Math.random() * 3);
    let subtotal = dec(0);
    let totalDiscount = dec(0);
    let landingCost = dec(0);
    const orderLineItems = [];

    for (let j = 0; j < itemsInOrder; j++) {
      const pick = products[Math.floor(Math.random() * products.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const price = dec(pick.price).mul(qty);
      const discount = dec(randomFloat(0, pick.price * 0.1)).mul(qty);
      const cost = dec(pick.cost).mul(qty);
      subtotal = subtotal.add(price);
      totalDiscount = totalDiscount.add(discount);
      landingCost = landingCost.add(cost);
      orderLineItems.push({ pick, qty, price, discount, cost });
    }

    const shipping = dec(randomFloat(5, 20));
    const tax = dec(randomFloat(2, 15));
    const totalPrice = subtotal.minus(totalDiscount).plus(shipping).plus(tax);
    const netPayment = totalPrice; // simple approximation

    const order = await prisma.order.create({
      data: {
        shopifyId: `gid://shopify/Order/${5000 + i}`,
        clientId,
        name: `#${10000 + i}`,
        currency: 'USD',
        subtotal,
        totalPrice,
        totalDiscounts: totalDiscount,
        totalShipping: shipping,
        totalTax: tax,
        netPayment,
        landingCost,
        fulfillmentStatus: 'fulfilled',
        financialStatus: 'paid',
        processedAt,
        updatedAt: processedAt,
        orderNumber: 10000 + i,
        customerId: `cust_${i % 10}`,
        discountCodes: totalDiscount.gt(0) ? JSON.stringify([{ code: 'WELCOME', amount: totalDiscount.toNumber() }]) : null,
        shippingLines: JSON.stringify([{ title: 'Standard', price: shipping.toNumber() }]),
      },
    });
    orders += 1;

    for (const li of orderLineItems) {
      await prisma.lineItem.create({
        data: {
          shopifyId: `gid://shopify/LineItem/${8000 + lineItems}`,
          orderId: order.id,
          productId: li.pick.product.shopifyId,
          variantId: `gid://shopify/ProductVariant/${2000 + products.indexOf(li.pick)}`,
          title: li.pick.product.title,
          sku: `${li.pick.product.handle}-sku`,
          quantity: li.qty,
          price: li.price,
          totalDiscount: li.discount,
          discountedTotal: li.price.minus(li.discount),
          fulfillmentStatus: 'fulfilled',
          landingCost: li.cost,
          netPayment: li.price.minus(li.discount),
        },
      });
      lineItems += 1;
    }
  }
  return { orders, lineItems };
};

const seed = async () => {
  const clientId = 'default-client';
  await prisma.lineItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.shopifyCredential.deleteMany({ where: { clientId } });

  const products = await createProducts(clientId);
  const { orders, lineItems } = await createOrders(clientId, products);

  console.log(`Seed completed: products=${products.length}, orders=${orders}, lineItems=${lineItems}`);
};

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
