import { Module } from '@nestjs/common';
import { DemoResetService } from './demo-reset.service';

/** Lojas de demonstração: limpeza automática uma vez por dia. */
@Module({
  providers: [DemoResetService],
})
export class DemoModule {}
