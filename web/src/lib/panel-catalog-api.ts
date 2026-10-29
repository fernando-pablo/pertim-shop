import { isUuid, PanelApiError, panelRequest } from './panel-api';
import type { AddonGroupInput, ProductInput } from './product-form';
import type { PanelCategory, PanelProduct } from './types';

/**
 * Produtos, opções, adicionais e categorias da loja logada (só servidor).
 * A loja vem do token: um id de outra loja responde "não encontrado".
 */

export function getPanelProducts(): Promise<PanelProduct[]> {
  return panelRequest<PanelProduct[]>('/panel/products');
}

export async function getPanelProduct(
  id: string,
): Promise<PanelProduct | null> {
  if (!isUuid(id)) return null;
  try {
    return await panelRequest<PanelProduct>(`/panel/products/${id}`);
  } catch (error) {
    if (error instanceof PanelApiError && error.status === 404) return null;
    throw error;
  }
}

/** Formato que a API espera (descrição vazia vira null). */
function productBody(input: ProductInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    priceCents: input.priceCents,
    categoryId: input.categoryId,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
  };
}

export function createProduct(input: ProductInput): Promise<PanelProduct> {
  return panelRequest<PanelProduct>('/panel/products', {
    method: 'POST',
    body: productBody(input),
  });
}

export function updateProduct(
  id: string,
  input: ProductInput,
): Promise<PanelProduct> {
  return panelRequest<PanelProduct>(`/panel/products/${id}`, {
    method: 'PATCH',
    body: productBody(input),
  });
}

/** Atalhos da lista: pausar/ativar e destacar. */
export function setProductFlags(
  id: string,
  flags: { isActive?: boolean; isFeatured?: boolean },
): Promise<PanelProduct> {
  return panelRequest<PanelProduct>(`/panel/products/${id}`, {
    method: 'PATCH',
    body: flags,
  });
}

export function deleteProduct(id: string): Promise<null> {
  return panelRequest<null>(`/panel/products/${id}`, { method: 'DELETE' });
}

export function updateVariant(
  productId: string,
  variantId: string,
  changes: {
    priceCents: number | null;
    stock: number | null;
    isActive: boolean;
  },
): Promise<PanelProduct> {
  return panelRequest<PanelProduct>(
    `/panel/products/${productId}/variants/${variantId}`,
    { method: 'PATCH', body: changes },
  );
}

/** Troca todos os grupos de adicionais do produto de uma vez. */
export function replaceAddonGroups(
  productId: string,
  groups: AddonGroupInput[],
): Promise<PanelProduct> {
  const body = {
    groups: groups.map((group) => ({
      name: group.name.trim(),
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      addons: group.addons.map((addon) => ({
        name: addon.name.trim(),
        priceCents: addon.priceCents,
      })),
    })),
  };
  return panelRequest<PanelProduct>(
    `/panel/products/${productId}/addon-groups`,
    { method: 'PUT', body },
  );
}

export function getPanelCategories(): Promise<PanelCategory[]> {
  return panelRequest<PanelCategory[]>('/panel/categories');
}

export function createCategory(name: string): Promise<PanelCategory> {
  return panelRequest<PanelCategory>('/panel/categories', {
    method: 'POST',
    body: { name },
  });
}

export function renameCategory(
  id: string,
  name: string,
): Promise<PanelCategory> {
  return panelRequest<PanelCategory>(`/panel/categories/${id}`, {
    method: 'PATCH',
    body: { name },
  });
}

export function deleteCategory(id: string): Promise<null> {
  return panelRequest<null>(`/panel/categories/${id}`, { method: 'DELETE' });
}

/** Volta a loja de demonstração aos dados originais. */
export function resetDemoStore(): Promise<{ message: string }> {
  return panelRequest<{ message: string }>('/panel/demo/reset', {
    method: 'POST',
  });
}
