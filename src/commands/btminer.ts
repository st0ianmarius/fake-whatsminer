import Miner from '../miner.js';
import { getUnixTime } from 'date-fns';

enum MsgStatus {
  OK = 'S',
}

enum MsgCode {
  INVALID = 14, // Invalid command or data
  OK = 131, // Command OK
  E = 132, // Command failed
}

const getCheckData = async (miner: Miner) => ({
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
});

const getMinerInfo = async (miner: Miner) => ({
  STATUS: 'S',
  Code: 131,
  When: getUnixTime(new Date()),
  Description: '',
  Msg: {
    mac: miner.mac,
  },
});

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
      DEVS: minerStats.hashboards.map((hashboard) => ({
        ID: hashboard.id,
        'Chip Temp Min': hashboard.temperature,
        'Chip Temp Max': hashboard.temperature,
        'Chip Temp Avg': hashboard.temperature,
        'MHS 5m': hashboard.hashrate * 1000000,
        'Fan Speed In': hashboard.fanSpeed.in,
        'Fan Speed Out': hashboard.fanSpeed.out,
        'Upfreq Complete': miner.isWarmingUp ? 0 : 1,
        'Chip Frequency': 598,
        Accepted: 100,
        Rejected: 50,
      })),
    },
  ];

  const pools = [
    {
      POOLS: miner.pools.map((pool, index) => ({
        URL: pool.url,
        User: pool.user,
        Status: 'Alive',
        Priority: index,
        'Pool Rejected%': 0,
      })),
    },
  ];

  return {
    summary,
    devs,
    pools,
  };
};

const getErrors = async (miner: Miner) => ({
  STATUS: MsgStatus.OK,
  Code: MsgCode.OK,
  When: getUnixTime(new Date()),
  Description: '',
  Msg: {
    // eslint-disable-next-line camelcase
    error_code: miner.errorCodes,
  },
});

const getPSUInfo = async (miner: Miner) => ({
  STATUS: MsgStatus.OK,
  Code: MsgCode.OK,
  When: getUnixTime(new Date()),
  Description: '',
  Msg: {
    name: miner.psu.name,
    model: miner.psu.model,
    // eslint-disable-next-line camelcase
    serial_no: miner.psu.serialNumber,

    iin: miner.psu.current,
    vin: miner.psu.voltage,
    // eslint-disable-next-line camelcase
    fan_speed: miner.psu.fanSpeed,

    version: miner.psu.version,
    // eslint-disable-next-line camelcase
    hw_version: miner.psu.hwVersion,
    // eslint-disable-next-line camelcase
    sw_version: miner.psu.swVersion,

    // It's not a typo !!
    vender: miner.psu.vendor,
  },
});

const getVersionInfo = async (miner: Miner) => ({
  STATUS: MsgStatus.OK,
  Code: MsgCode.OK,
  When: getUnixTime(new Date()),
  Description: '',
  Msg: {
    // eslint-disable-next-line camelcase
    api_ver: miner.apiVersion,
    // eslint-disable-next-line camelcase
    fw_ver: miner.firmwareVersion,
  },
});

const powerOnMiner = async (miner: Miner) => {
  miner.isSuspended = false;

  return {
    STATUS: MsgStatus.OK,
    Code: MsgCode.OK,
    When: getUnixTime(new Date()),
    Description: '',
    Msg: 'API command OK',
  };
};

const powerOffMiner = async (miner: Miner) => {
  miner.isSuspended = true;

  return {
    STATUS: MsgStatus.OK,
    Code: MsgCode.OK,
    When: getUnixTime(new Date()),
    Description: '',
    Msg: 'API command OK',
  };
};

const commands = new Map<
  string,
  (_miner: Miner, _payload?: unknown) => Promise<unknown>
>([
  ['summary+devdetails', getCheckData],
  ['summary+devs+devdetails+pools', getStatistics],
  ['get_miner_info', getMinerInfo],
  ['get_psu', getPSUInfo],
  ['get_version', getVersionInfo],
  ['get_error_code', getErrors],
  ['power_on', powerOnMiner],
  ['power_off', powerOffMiner],
]);

const handleCommand = async (
  miner: Miner,
  command: string,
  payload?: unknown
) => {
  const fn = commands.get(command);
  if (fn) {
    return fn(miner, payload);
  }

  throw new Error(`Unknown btminer command: ${command}`);
};

export { handleCommand };
