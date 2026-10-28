import { Prisma } from '../generated/prisma/client';

/** O banco recusou porque já existe um registro igual (ex.: categoria repetida). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
