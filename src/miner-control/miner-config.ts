import { Static, Type } from '@sinclair/typebox';
import Miner, { PowerMode } from '../miner.js';
import { FastifyInstance } from 'fastify';
import is from '@sindresorhus/is';

const RangeOrNumber = Type.Union([
  Type.Object({
    min: Type.Number(),
    max: Type.Number(),
  }),
  Type.Number(),
]);

const MinerConfig = Type.Partial(
  Type.Object({
    envTemp: RangeOrNumber,

    powerMode: Type.Enum(PowerMode),
    powerDraw: RangeOrNumber,

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
        hashrate: RangeOrNumber,
        temperature: RangeOrNumber,
        fanSpeed: Type.Object({
          in: RangeOrNumber,
          out: RangeOrNumber,
        }),
      })
    ),
  })
);

const MinerConfigResponse = Type.Object({
  mac: Type.String(),
  model: Type.String(),
  apiVersion: Type.String(),
  firmwareVersion: Type.String(),
  credentials: Type.Object({
    username: Type.String(),
    password: Type.String(),
  }),
  envTemp: RangeOrNumber,
  powerMode: Type.Enum(PowerMode),
  powerDraw: RangeOrNumber,
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
      hashrate: RangeOrNumber,
      temperature: RangeOrNumber,
      fanSpeed: Type.Object({
        in: RangeOrNumber,
        out: RangeOrNumber,
      }),
    })
  ),
});

export default async function (
  server: FastifyInstance,
  { miner }: { miner: Miner }
) {
  server.get(
    '/miner-config',
    {
      schema: {
        response: {
          200: MinerConfigResponse,
        },
      },
    },
    () => miner.getConfig()
  );

  server.patch<{ Body: Static<typeof MinerConfig> }>(
    '/miner-config',
    {
      schema: {
        body: MinerConfig,
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
          miner.envTemp = envTemp;
        }

        if (powerMode) {
          miner.powerMode = powerMode;
        }

        if (powerDraw) {
          miner.powerDraw = powerDraw;
        }

        if (errorCodes) {
          miner.errorCodes = errorCodes;
        }

        if (pools) {
          miner.pools = pools;
        }

        if (hashboards) {
          miner.hashboards = hashboards;
        }

        if (is.boolean(isSuspended)) {
          miner.isSuspended = isSuspended;
        }

        if (is.boolean(isWarmingUp)) {
          miner.isWarmingUp = isWarmingUp;
        }
      }

      return miner.getConfig();
    }
  );
}
