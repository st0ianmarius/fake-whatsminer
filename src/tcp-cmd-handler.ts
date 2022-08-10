import Miner from './miner.js';

const getCheckData = async (miner: Miner) => {
  return {
    summary: {
      0: {
        SUMMARY: {
          0: {
            MAC: miner.mac,
          },
        },
      },
    },
    devdetails: {
      0: {
        DEVDETAILS: {
          0: {
            Model: miner.model,
          },
        },
      },
    },
  };
};

const getMinerInfo = async (miner: Miner) => {
  return {
    Msg: {
      mac: miner.mac,
    },
  };
};

const getStatistics = async (miner: Miner) => {
  const minerStats = miner.getStats();
  const summary = [
    {
      SUMMARY: [
        {
          MAC: minerStats.mac,
          Power: minerStats.powerDraw,
          'Power Mode': minerStats.powerMode,
          'Env Temp': minerStats.envTemp,
        },
      ],
    },
  ];

  const devs = [
    {
      DEVS: minerStats.hashboards.map((hashboard) => {
        return {
          ID: hashboard.id,
          'Chip Temp Min': hashboard.temperature,
          'Chip Temp Max': hashboard.temperature,
          'Chip Temp Avg': hashboard.temperature,
          'MHS 5m': hashboard.hashrate * 1000000,
          'Fan Speed In': hashboard.fanSpeed.in,
          'Fan Speed Out': hashboard.fanSpeed.out,
          'Upfreq Complete': miner.isWarmingUp ? 0 : 1,
          // TODO: make below customizable
          'Chip Frequency': 598,
          Accepted: 100,
          Rejected: 50,
        };
      }),
    },
  ];

  return {
    summary,
    devs,
  };
};

const commands = new Map<
  string,
  (miner: Miner, payload?: unknown) => Promise<unknown>
>([
  ['summary+devs', getCheckData],
  ['summary+devs+devdetails+pools', getStatistics],
  ['get_miner_info', getMinerInfo],
]);

const handleTCPCommand = async (
  miner: Miner,
  command: string,
  payload?: unknown
) => {
  const fn = commands.get(command);
  if (fn) {
    return fn(miner, payload);
  }
  throw new Error(`Unknown command: ${command}`);
};

export default handleTCPCommand;
