import { slugify } from './demo-helpers';
import { DEMO_STORES } from './stores';

/** Confere se os dados de exemplo fazem sentido antes de irem para o banco. */
describe('Dados de demonstração', () => {
  it('cada loja tem um endereço (slug) único e válido', () => {
    const slugs = DEMO_STORES.map((store) => store.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((slug) => expect(slug).toBe(slugify(slug)));
  });

  it('cada lojista tem um e-mail único', () => {
    const emails = DEMO_STORES.map((store) => store.merchant.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  describe.each(DEMO_STORES.map((store) => [store.name, store] as const))(
    '%s',
    (_name, store) => {
      it('todo produto está numa categoria que existe', () => {
        for (const product of store.products) {
          expect(store.categories).toContain(product.category);
        }
      });

      it('preços em centavos: números inteiros e positivos', () => {
        for (const product of store.products) {
          expect(Number.isInteger(product.priceCents)).toBe(true);
          expect(product.priceCents).toBeGreaterThan(0);
          for (const variant of product.variants ?? []) {
            if (variant.priceCents !== undefined) {
              expect(Number.isInteger(variant.priceCents)).toBe(true);
            }
          }
        }
      });

      it('estoque nunca é negativo', () => {
        for (const product of store.products) {
          for (const variant of product.variants ?? []) {
            expect(variant.stock ?? 0).toBeGreaterThanOrEqual(0);
          }
        }
      });

      it('grupos de adicionais têm mínimo e máximo coerentes', () => {
        for (const product of store.products) {
          for (const group of product.addonGroups ?? []) {
            expect(group.minSelect).toBeLessThanOrEqual(group.maxSelect);
            expect(group.maxSelect).toBeLessThanOrEqual(group.addons.length);
          }
        }
      });

      it('nomes de produtos não se repetem na loja', () => {
        const names = store.products.map((product) => product.name);
        expect(new Set(names).size).toBe(names.length);
      });
    },
  );
});
