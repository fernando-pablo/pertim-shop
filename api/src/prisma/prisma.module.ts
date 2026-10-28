import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global: qualquer módulo da API pode pedir o PrismaService. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
