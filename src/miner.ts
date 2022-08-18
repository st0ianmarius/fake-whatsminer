interface Range {
  min: number;
  max: number;
}

type RangeOrNumber = Range | number;

enum PowerMode {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
}

interface FanSpeed {
  in: RangeOrNumber;
  out: RangeOrNumber;
}

interface Hashboard {
  id: number;
  hashrate: RangeOrNumber;
  temperature: RangeOrNumber;
  fanSpeed: FanSpeed;
}

interface MinerOptions {
  mac: string;
  model: string;

  credentials: MinerCredentials;

  apiVersion: string;
  firmwareVersion: string;

  powerDraw: RangeOrNumber;
  powerMode: PowerMode;

  psu: MinerPSU;

  envTemp: RangeOrNumber;

  stopWarmUpAfter?: number;
  errorCodes?: number[];

  hashboards: Hashboard[];
  pools: MiningPool[];
}

interface MinerStats {
  mac: string;
  model: string;

  powerDraw: number;
  powerMode: PowerMode;

  isWarmingUp: boolean;

  envTemp: number;

  hashboards: {
    id: number;
    hashrate: number;
    temperature: number;
    fanSpeed: {
      in: number;
      out: number;
    };
  }[];
}

interface MiningPool {
  url: string;
  user: string;
  password: string;
}

interface MinerPSU {
  name: string;
  model: string;
  serialNumber: string;

  current: number;
  voltage: number;
  fanSpeed: number;

  vendor: string;
  version: string;
  hwVersion: string;
  swVersion: string;
}

interface MinerCredentials {
  username: string;
  password: string;
}

const getRangeOrNumberValue = (value: RangeOrNumber): number => {
  if (typeof value === 'number') {
    return value;
  }

  return Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
};

class Miner {
  mac: string;
  model: string;

  credentials: MinerCredentials;

  apiVersion: string;
  firmwareVersion: string;

  powerMode: PowerMode;
  powerDraw: RangeOrNumber;

  psu: MinerPSU;

  envTemp: RangeOrNumber;

  isSuspended: boolean = false;

  sleepUntil: Date | null = null;

  isWarmingUp: boolean = true;
  stopWarmUpAfter: number = 5; // In minutes

  hashboards: Hashboard[];

  pools: MiningPool[] = [];

  errorCodes: number[] = [];

  constructor(options: MinerOptions) {
    this.mac = options.mac;
    this.model = options.model;

    this.credentials = options.credentials;

    this.apiVersion = options.apiVersion;
    this.firmwareVersion = options.firmwareVersion;

    this.powerMode = options.powerMode;
    this.powerDraw = options.powerDraw;

    this.psu = options.psu;

    this.envTemp = options.envTemp;

    if (options.stopWarmUpAfter) {
      this.stopWarmUpAfter = options.stopWarmUpAfter;
    }

    if (options.errorCodes) {
      this.errorCodes = options.errorCodes;
    }

    if (options.pools) {
      this.pools = options.pools;
    }

    this.hashboards = options.hashboards;
  }

  getStats(): MinerStats {
    const stats: Partial<MinerStats> = {
      mac: this.mac,
      model: this.model,

      powerMode: this.powerMode,
      powerDraw: getRangeOrNumberValue(this.powerDraw),

      envTemp: getRangeOrNumberValue(this.envTemp),

      hashboards: this.hashboards.map((hashboard) => ({
        id: hashboard.id,
        hashrate: getRangeOrNumberValue(hashboard.hashrate),
        temperature: getRangeOrNumberValue(hashboard.temperature),
        fanSpeed: {
          in: getRangeOrNumberValue(hashboard.fanSpeed.in),
          out: getRangeOrNumberValue(hashboard.fanSpeed.out),
        },
      })),
    };

    // Get node process uptime in minutes
    const uptime = Math.floor(process.uptime() / 60);

    if (this.isWarmingUp) {
      if (uptime >= this.stopWarmUpAfter) {
        this.isWarmingUp = false;
      }
    }

    stats.isWarmingUp = this.isWarmingUp;

    return stats as MinerStats;
  }
}

export { PowerMode, MinerOptions };
export default Miner;
