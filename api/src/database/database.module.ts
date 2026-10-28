import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/** "Etiqueta" usada para pedir a conexão com o banco em qualquer parte da API. */
export const PG_POOL = Symbol('PG_POOL');

/**
 * Conexão com o PostgreSQL.
 * Pool = um pequeno grupo de conexões reaproveitadas, em vez de abrir uma nova
 * a cada consulta. Na Etapa 2 o acesso ao banco passa a ser feito por um ORM.
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool => {
        const pool = new Pool({
          connectionString: config.getOrThrow<string>('DATABASE_URL'),
          max: 5,
          connectionTimeoutMillis: 3000,
          query_timeout: 3000,
        });

        // Sem isso, uma queda do banco derrubaria a API inteira.
        pool.on('error', (error) =>
          new Logger('Database').error(`Erro no banco: ${error.message}`),
        );

        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
