type Arg = string | number;

interface Entry {
  value: string;
  expiresAt?: number;
}

/**
 * Redis "de mentira", na memória, para os testes de unidade. Tem só os
 * comandos que a API usa. Dá para simular o Redis fora do ar (failing) e
 * adiantar o relógio (now).
 */
export class FakeRedis {
  readonly data = new Map<string, Entry>();
  failing = false;
  now = (): number => Date.now();

  get(key: string): Promise<string | null> {
    return this.run(() => this.read(key)?.value ?? null);
  }

  set(key: string, value: Arg, ...options: Arg[]): Promise<'OK' | null> {
    return this.run(() => this.write(key, value, options));
  }

  del(key: string): Promise<number> {
    return this.run(() => (this.data.delete(key) ? 1 : 0));
  }

  incr(key: string): Promise<number> {
    return this.run(() => this.increment(key));
  }

  ttl(key: string): Promise<number> {
    return this.run(() => this.secondsLeft(key));
  }

  /** Comandos em grupo: só rodam no exec(). */
  multi() {
    const commands: (() => unknown)[] = [];
    const chain = {
      set: (key: string, value: Arg, ...options: Arg[]) => {
        commands.push(() => this.write(key, value, options));
        return chain;
      },
      incr: (key: string) => {
        commands.push(() => this.increment(key));
        return chain;
      },
      ttl: (key: string) => {
        commands.push(() => this.secondsLeft(key));
        return chain;
      },
      exec: () =>
        this.run(() => commands.map((command) => [null, command()] as const)),
    };
    return chain;
  }

  private run<T>(command: () => T): Promise<T> {
    if (this.failing) return Promise.reject(new Error('Redis fora do ar'));
    return Promise.resolve(command());
  }

  private write(key: string, value: Arg, options: Arg[]): 'OK' | null {
    if (options.includes('NX') && this.read(key)) return null;
    const ex = options.indexOf('EX');
    const seconds = ex >= 0 ? Number(options[ex + 1]) : undefined;
    this.data.set(key, {
      value: String(value),
      expiresAt: seconds ? this.now() + seconds * 1000 : undefined,
    });
    return 'OK';
  }

  private increment(key: string): number {
    const entry = this.read(key);
    const next = Number(entry?.value ?? 0) + 1;
    this.data.set(key, { value: String(next), expiresAt: entry?.expiresAt });
    return next;
  }

  private secondsLeft(key: string): number {
    const entry = this.read(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    return Math.ceil((entry.expiresAt - this.now()) / 1000);
  }

  private read(key: string): Entry | undefined {
    const entry = this.data.get(key);
    if (entry?.expiresAt && entry.expiresAt <= this.now()) {
      this.data.delete(key);
      return undefined;
    }
    return entry;
  }
}

/** Cache que não guarda nada: sempre busca no banco. Para testar os serviços. */
export const passThroughCache = {
  storeList: <T>(load: () => Promise<T>) => load(),
  store: <T>(_slug: string, load: () => Promise<T>) => load(),
  catalog: <T>(_storeId: string, _name: string, load: () => Promise<T>) =>
    load(),
  invalidateStore: () => Promise.resolve(),
};
