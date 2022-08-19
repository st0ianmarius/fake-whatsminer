import fastify, { FastifyInstance } from 'fastify';
import is from '@sindresorhus/is';
import consola from 'consola';
import Miner, {
  Hashboard,
  MiningPool,
  PowerMode,
  RangeOrNumber,
} from '../miner';

interface ConfigServerOptions {
  port: number;
}

interface MinerConfigBody {
  envTemp?: RangeOrNumber;

  powerMode: PowerMode;
  powerDraw: RangeOrNumber;

  isSuspended?: boolean;
  isWarmingUp?: boolean;

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

    this.server.post<{ Body: MinerConfigBody }>(
      '/config',
      async (req, reply) => {
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

          // You have to provide all hashboards if you want to modify them
          if (is.array(hashboards) && hashboards.length === 3) {
            miner.hashboards = hashboards;
          }
        }

        reply.code(200).send();
      }
    );
  }

  public async start() {
    const addr = await this.server.listen({ port: this.port });
    consola.success(`Config Server is now listening on ${addr}`);
  }
}

export { ConfigServerOptions };
export default Config;
