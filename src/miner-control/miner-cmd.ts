import { FastifyInstance } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import Miner, { MinerCommand } from '../miner.js';

const MinerCmd = Type.Object({
  cmd: Type.Enum(MinerCommand),
  behaviour: Type.Object({
    fail: Type.Boolean(),
    delay: Type.Number(),
  }),
});

export default async function (
  server: FastifyInstance,
  { miner }: { miner: Miner }
) {
  server.get(
    '/miner-cmd',
    {
      schema: {
        response: {
          200: Type.Array(MinerCmd),
        },
      },
    },
    async () => {
      const result = [];
      for (const [cmd, behaviour] of miner.cmdBehaviour) {
        result.push({
          cmd,
          behaviour,
        });
      }

      return result;
    }
  );

  server.patch<{ Body: Static<typeof MinerCmd> }>(
    '/miner-cmd',
    {
      schema: {
        body: MinerCmd,
        response: {
          200: MinerCmd,
        },
      },
    },
    async (req) => {
      const { cmd, behaviour } = req.body;

      miner.cmdBehaviour.set(cmd, behaviour);

      return {
        cmd,
        behaviour,
      };
    }
  );
}
