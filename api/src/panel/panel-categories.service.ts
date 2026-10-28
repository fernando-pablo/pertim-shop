import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  PanelCategoryDto,
  UpdateCategoryDto,
} from './dto/panel-category.dto';

const DUPLICATED = 'Já existe uma categoria com esse nome';

/** Categorias da loja do lojista logado. Todo acesso filtra pelo storeId. */
@Injectable()
export class PanelCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(storeId: string): Promise<PanelCategoryDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { storeId },
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      position: category.position,
      productCount: category._count.products,
    }));
  }

  async create(
    storeId: string,
    dto: CreateCategoryDto,
  ): Promise<PanelCategoryDto> {
    try {
      const category = await this.prisma.category.create({
        data: { storeId, name: dto.name, position: dto.position ?? 0 },
      });
      return {
        id: category.id,
        name: category.name,
        position: category.position,
        productCount: 0,
      };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATED);
      throw error;
    }
  }

  async update(
    storeId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<PanelCategoryDto> {
    await this.ensureOwned(storeId, id);
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: dto,
        include: { _count: { select: { products: true } } },
      });
      return {
        id: category.id,
        name: category.name,
        position: category.position,
        productCount: category._count.products,
      };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictException(DUPLICATED);
      throw error;
    }
  }

  /** Os produtos da categoria continuam existindo, só ficam sem categoria. */
  async remove(storeId: string, id: string): Promise<void> {
    await this.ensureOwned(storeId, id);
    await this.prisma.category.delete({ where: { id } });
  }

  private async ensureOwned(storeId: string, id: string): Promise<void> {
    const found = await this.prisma.category.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('Categoria não encontrada');
  }
}
