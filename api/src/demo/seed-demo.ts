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
 * Cria (ou recria do zero) as lojas de demonstração com produtos, variações,
 * adicionais e um lojista. A mesma função vai servir para o botão
 * "restaurar dados" do modo demonstração.
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
    // Cada loja numa transação: ou cria tudo, ou não cria nada.
    await prisma.$transaction((tx) => recreateStore(tx, demo, passwordHash), {
      timeout: 30_000,
    });
    log(`Loja criada: ${demo.name} (${demo.products.length} produtos)`);
  }
  return DEMO_STORES.map((demo) => demo.slug);
}

async function recreateStore(
  tx: Tx,
  demo: DemoStore,
  passwordHash: string,
): Promise<void> {
  // Apaga a versão antiga; o banco apaga junto tudo o que é dela (cascade).
  await tx.store.deleteMany({ where: { slug: demo.slug } });

  const store = await tx.store.create({
    data: {
      slug: demo.slug,
      name: demo.name,
      segment: demo.segment,
      description: demo.description,
      whatsapp: demo.whatsapp,
      theme: demo.theme as unknown as Prisma.InputJsonValue,
      isDemo: true,
      merchants: {
        create: { ...demo.merchant, passwordHash },
      },
      categories: {
        create: demo.categories.map((name, position) => ({ name, position })),
      },
    },
    include: { categories: true },
  });

  const categoryIds = new Map(store.categories.map((c) => [c.name, c.id]));
  for (const [position, product] of demo.products.entries()) {
    await tx.product.create({
      data: toProductData(demo, product, position, store.id, categoryIds),
    });
  }
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
    imageUrl: imagePath(demo.slug, product.name),
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
