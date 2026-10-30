import { Module } from '@nestjs/common';
import { ProxyInfoController } from './proxy-info.controller';

/** Ferramentas de diagnóstico, todas desligadas por padrão. */
@Module({
  controllers: [ProxyInfoController],
})
export class DebugModule {}
