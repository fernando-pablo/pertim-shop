import { hash } from 'bcryptjs';
import { Prisma, PrismaClient } from '../generated/prisma/client';
import { imagePath } from './demo-helpers';
import { DemoProduct, DemoStore } from './demo-types';
import { DEMO_STORES } from './stores';

type Tx = Prisma.TransactionClient;

export interface SeedOptions {
  /** Só cria as lojas se o banco ainda não tiver nenhuma */
  onlyIfEmpty?: boolean;
  /** Senha dos lojistas de demonstração */
  password: string;
  log?: (message: string) => void;
}

/**
 * Cria (ou restaura) as lojas de demonstração com produtos, variações,
 * adicionais e um lojista.
 */
export async function seedDemoStores(
  prisma: PrismaClient,
  { onlyIfEmpty = false, password, log = () => undefined }: SeedOptions,
): Promise<string[]> {
  if (onlyIfEmpty && (await prisma.store.count()) > 0) {
    log('O banco já tem lojas; dados de exemplo não foram criados.');
    return [];
  }

  const passwordHash = await hash(password, 10);
  for (const demo of DEMO_STORES) {
    await restoreStore(prisma, demo, passwordHash);
    log(`Loja criada: ${demo.name} (${demo.products.length} produtos)`);
  }
  return DEMO_STORES.map((demo) => demo.slug);
}

/** Botão "restaurar dados" do modo demonstração: volta a loja ao original. */
export async function resetDemoStore(
  prisma: PrismaClient,
  slug: string,
  password: string,
): Promise<DemoStore | null> {
  const demo = DEMO_STORES.find((store) => store.slug === slug);
  if (!demo) return null;
  await restoreStore(prisma, demo, await hash(password, 10));
  return demo;
}

/** Cada loja numa transação: ou restaura tudo, ou não muda nada. */
function restoreStore(
  prisma: PrismaClient,
  demo: DemoStore,
  passwordHash: string,
): Promise<void> {
  return prisma.$transaction(
    async (tx) => {
      const storeId = await upsertStore(tx, demo, passwordHash);
      const categoryIds = new Map<string, string>();
      for (const [position, name] of demo.categories.entries()) {
        const category = await tx.category.create({
          data: { storeId, name, position },
        });
        categoryIds.set(name, category.id);
      }
      for (const [position, product] of demo.products.entries()) {
        await tx.product.create({
          data: toProductData(demo, product, position, storeId, categoryIds),
        });
      }
    },
    { timeout: 30_000 },
  );
}

/**
 * Se a loja já existe, apaga pedidos, produtos e categorias e atualiza os
 * dados. A loja e o lojista mantêm o mesmo id, então quem está logado no
 * painel continua logado depois de restaurar.
 */
async function upsertStore(
  tx: Tx,
  demo: DemoStore,
  passwordHash: string,
): Promise<string> {
  const data = {
    name: demo.name,
    segment: demo.segment,
    description: demo.description,
    whatsapp: demo.whatsapp,
    theme: demo.theme as unknown as Prisma.InputJsonValue,
    isDemo: true,
    isActive: true,
    lastOrderNumber: 0,
  };

  const existing = await tx.store.findUnique({ where: { slug: demo.slug } });
  const store = existing
    ? await tx.store.update({ where: { id: existing.id }, data })
    : await tx.store.create({ data: { slug: demo.slug, ...data } });

  if (existing) {
    await tx.order.deleteMany({ where: { storeId: store.id } });
    await tx.product.deleteMany({ where: { storeId: store.id } });
    await tx.category.deleteMany({ where: { storeId: store.id } });
  }

  await tx.merchant.upsert({
    where: { email: demo.merchant.email },
    update: { name: demo.merchant.name, passwordHash, storeId: store.id },
    create: { ...demo.merchant, passwordHash, storeId: store.id },
  });
  return store.id;
}

function toProductData(
  demo: DemoStore,
  product: DemoProduct,
  position: number,
  storeId: string,
  categoryIds: Map<string, string>,
): Prisma.ProductUncheckedCreateInput {
  return {
    storeId,
    categoryId: categoryIds.get(product.category),
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    // Sem foto, a vitrine mostra um desenho no lugar.
    imageUrl: demo.photos ? imagePath(demo.slug, product.name) : null,
    isFeatured: product.featured ?? false,
    position,
    variants: {
      create: (product.variants ?? []).map((variant, index) => ({
        name: variant.name,
        attributes: variant.attributes ?? {},
        priceCents: variant.priceCents ?? null,
        stock: variant.stock ?? null,
        position: index,
      })),
    },
    addonGroups: {
      create: (product.addonGroups ?? []).map((group, index) => ({
        name: group.name,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        position: index,
        addons: {
          create: group.addons.map((addon, addonIndex) => ({
            ...addon,
            position: addonIndex,
          })),
        },
      })),
    },
  };
}
