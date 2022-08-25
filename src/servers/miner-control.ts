import fastify, { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import consola from 'consola';
import Miner from '../miner.js';

import minerConfig from '../miner-control/miner-config.js';
import minerStats from '../miner-control/miner-stats.js';
import minerCmd from '../miner-control/miner-cmd.js';

interface MinerControlServerOptions {
  port: number;
}

class MinerControlServer {
  private readonly server: FastifyInstance;

  private readonly miner: Miner;

  private readonly port: number = 9000;

  constructor(miner: Miner, options: Partial<MinerControlServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = fastify();
    this.miner = miner;
  }

  public async start() {
    await this.server.register(fastifySwagger, {
      routePrefix: '/docs',
      exposeRoute: true,
    });

    // Register plugins
    const pluginOpts = {
      miner: this.miner,
    };
    await minerConfig(this.server, pluginOpts);
    await minerStats(this.server, pluginOpts);
    await minerCmd(this.server, pluginOpts);

    // Start the server
    const addr = await this.server.listen({ port: this.port, host: '0.0.0.0' });
    consola.success(`Miner Control Server is now listening on ${addr}`);
    consola.info(
      `Miner Control Server documentation is available on ${addr}/docs`
    );
  }
}

export { MinerControlServerOptions };
export default MinerControlServer;
