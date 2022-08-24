import { FastifyInstance } from 'fastify';
import Miner, { PowerMode } from '../miner.js';
import { Type } from '@sinclair/typebox';

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

export default async function (
  server: FastifyInstance,
  { miner }: { miner: Miner }
) {
  server.get(
    '/miner-stats',
    {
      schema: {
        response: {
          200: MinerStatsResponse,
        },
      },
    },
    () => miner.getFullStats()
  );
}
