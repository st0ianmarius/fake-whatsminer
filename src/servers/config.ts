import fastify, { FastifyInstance } from 'fastify';
import consola from 'consola';
import Miner from '../miner';

interface ConfigServerOptions {
  port: number;
}

class Config {
  private server: FastifyInstance;

  private readonly port: number = 9000;

  constructor(_miner: Miner, options: Partial<ConfigServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = fastify();
  }

  public async start() {
    const addr = await this.server.listen({ port: this.port });
    consola.success(`Config Server is now listening on ${addr}`);
  }
}

export { ConfigServerOptions };
export default Config;
