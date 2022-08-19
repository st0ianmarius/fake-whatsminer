import fastify, { FastifyInstance } from 'fastify';
import is from '@sindresorhus/is';
import consola from 'consola';
import Miner, {
  Hashboard,
  MiningPool,
  PowerMode,
  RangeOrNumber,
} from '../miner';
import ms from 'ms';

interface ConfigServerOptions {
  port: number;
}

interface MinerConfigBody {
  envTemp?: RangeOrNumber;

  powerMode: PowerMode;
  powerDraw: RangeOrNumber;

  isSuspended?: boolean;
  isWarmingUp?: boolean;

  resetRestart?: boolean;

  errorCodes?: number[];

  pools?: MiningPool[];

  hashboards?: Hashboard[];
}

class Config {
  private server: FastifyInstance;

  private readonly port: number = 9000;

  constructor(miner: Miner, options: Partial<ConfigServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = fastify();

    this.server.get('/stats', () => miner.getInfo());

    this.server.post('/kill', (_req, reply) => {
      consola.info('Shutting down in 5 seconds');

      // Kill the process in 5 seconds
      setTimeout(() => {
        process.exit(0);
      }, ms('5s'));

      reply.code(200).send();
    });

    this.server.post<{ Body: MinerConfigBody }>('/config', async (req) => {
      if (req.body) {
        const {
          envTemp,
          powerMode,
          powerDraw,
          isSuspended,
          isWarmingUp,
          errorCodes,
          pools,
          hashboards,
          resetRestart,
        } = req.body;

        if (envTemp) {
          miner.envTemp = envTemp;
        }

        if (powerMode) {
          miner.powerMode = powerMode;
        }

        if (powerDraw) {
          miner.powerDraw = powerDraw;
        }

        if (is.boolean(isSuspended)) {
          miner.isSuspended = isSuspended;
        }

        if (is.boolean(isWarmingUp)) {
          miner.isWarmingUp = isWarmingUp;
        }

        if (is.array(errorCodes)) {
          miner.errorCodes = errorCodes;
        }

        if (is.array(pools)) {
          miner.pools = pools;
        }

        if (is.boolean(resetRestart) && resetRestart) {
          miner.rebootedAt = null;
        }

        // You have to provide all hashboards if you want to modify them
        if (is.array(hashboards) && hashboards.length === 3) {
          miner.hashboards = hashboards;
        }
      }

      return miner.getInfo();
    });
  }

  public async start() {
    const addr = await this.server.listen({ port: this.port, host: '0.0.0.0' });
    consola.success(`Config Server is now listening on ${addr}`);
  }
}

export { ConfigServerOptions };
export default Config;
