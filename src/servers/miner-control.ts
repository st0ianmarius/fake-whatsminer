import fastify, { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import { Static, Type } from '@sinclair/typebox';
import is from '@sindresorhus/is';
import consola from 'consola';
import Miner, { PowerMode } from '../miner.js';

interface MinerControlServerOptions {
  port: number;
}

const RangeOrNumberValidation = Type.Union([
  Type.Object({
    min: Type.Number(),
    max: Type.Number(),
  }),
  Type.Number(),
]);

const MinerConfigValidation = Type.Partial(
  Type.Object({
    envTemp: RangeOrNumberValidation,

    powerMode: Type.Enum(PowerMode),
    powerDraw: RangeOrNumberValidation,

    isSuspended: Type.Boolean(),
    isWarmingUp: Type.Boolean(),

    errorCodes: Type.Array(Type.Number()),

    pools: Type.Array(
      Type.Object({
        url: Type.String(),
        user: Type.String(),
        password: Type.String(),
      })
    ),

    hashboards: Type.Array(
      Type.Object({
        id: Type.Number(),
        hashrate: RangeOrNumberValidation,
        temperature: RangeOrNumberValidation,
        fanSpeed: Type.Object({
          in: RangeOrNumberValidation,
          out: RangeOrNumberValidation,
        }),
      })
    ),
  })
);

const MinerStatsResponse = Type.Object({
  envTemp: Type.Number(),
  powerMode: Type.Enum(PowerMode),
  powerDraw: Type.Number(),
  isSuspended: Type.Boolean(),
  isWarmingUp: Type.Boolean(),
  errorCodes: Type.Array(Type.Number()),
  pools: Type.Array(
    Type.Object({
      url: Type.String(),
      user: Type.String(),
      password: Type.String(),
    })
  ),
  hashboards: Type.Array(
    Type.Object({
      id: Type.Number(),
      hashrate: Type.Number(),
      temperature: Type.Number(),
      fanSpeed: Type.Object({
        in: Type.Number(),
        out: Type.Number(),
      }),
    })
  ),
});

const MinerConfigResponse = Type.Object({
  mac: Type.String(),
  model: Type.String(),
  apiVersion: Type.String(),
  firmwareVersion: Type.String(),
  credentials: Type.Object({
    username: Type.String(),
    password: Type.String(),
  }),
  envTemp: RangeOrNumberValidation,
  powerMode: Type.Enum(PowerMode),
  powerDraw: RangeOrNumberValidation,
  isSuspended: Type.Boolean(),
  isWarmingUp: Type.Boolean(),
  deadTimeBetweenRestarts: Type.Number(),
  stopWarmUpAfter: Type.Number(),
  errorCodes: Type.Array(Type.Number()),
  pools: Type.Array(
    Type.Object({
      url: Type.String(),
      user: Type.String(),
      password: Type.String(),
    })
  ),
  hashboards: Type.Array(
    Type.Object({
      id: Type.Number(),
      hashrate: RangeOrNumberValidation,
      temperature: RangeOrNumberValidation,
      fanSpeed: Type.Object({
        in: RangeOrNumberValidation,
        out: RangeOrNumberValidation,
      }),
    })
  ),
});

type MinerConfigType = Static<typeof MinerConfigValidation>;

class MinerControlServer {
  private server: FastifyInstance;

  private miner: Miner;

  private readonly port: number = 9000;

  constructor(miner: Miner, options: Partial<MinerControlServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = fastify();
    this.miner = miner;
  }

  private registerRoutes() {
    this.server.get(
      '/miner-stats',
      {
        schema: {
          response: {
            200: MinerStatsResponse,
          },
        },
      },
      () => this.miner.getFullStats()
    );

    this.server.get(
      '/miner-config',
      {
        schema: {
          response: {
            200: MinerConfigResponse,
          },
        },
      },
      () => this.miner.getConfig()
    );

    this.server.patch<{ Body: MinerConfigType }>(
      '/miner-config',
      {
        schema: {
          body: MinerConfigValidation,
          response: {
            200: MinerConfigResponse,
          },
        },
      },
      async (req) => {
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
            this.miner.envTemp = envTemp;
          }

          if (powerMode) {
            this.miner.powerMode = powerMode;
          }

          if (powerDraw) {
            this.miner.powerDraw = powerDraw;
          }

          if (errorCodes) {
            this.miner.errorCodes = errorCodes;
          }

          if (pools) {
            this.miner.pools = pools;
          }

          if (hashboards) {
            this.miner.hashboards = hashboards;
          }

          if (is.boolean(isSuspended)) {
            this.miner.isSuspended = isSuspended;
          }

          if (is.boolean(isWarmingUp)) {
            this.miner.isWarmingUp = isWarmingUp;
          }
        }

        return this.miner.getConfig();
      }
    );
  }

  public async start() {
    await this.server.register(fastifySwagger, {
      routePrefix: '/docs',
      exposeRoute: true,
    });

    this.registerRoutes();

    const addr = await this.server.listen({ port: this.port, host: '0.0.0.0' });
    consola.success(`Config Server is now listening on ${addr}`);
    consola.info(`Config Server documentation is available at ${addr}/docs`);
  }
}

export { MinerControlServerOptions };
export default MinerControlServer;
