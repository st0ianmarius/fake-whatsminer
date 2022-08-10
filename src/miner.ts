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

  powerDraw: RangeOrNumber;
  powerMode: PowerMode;

  envTemp: RangeOrNumber;

  stopWarmUpAfter?: number;

  hashboards: Hashboard[];
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

const getRangeOrNumberValue = (value: RangeOrNumber): number => {
  if (typeof value === 'number') {
    return value;
  }

  return Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
};

class Miner {
  mac: string;
  model: string;

  powerMode: PowerMode;
  powerDraw: RangeOrNumber;

  envTemp: RangeOrNumber;

  isWarmingUp: boolean = true;
  stopWarmUpAfter: number = 5; // minutes

  hashboards: Hashboard[];

  constructor(options: MinerOptions) {
    this.mac = options.mac;
    this.model = options.model;

    this.powerMode = options.powerMode;
    this.powerDraw = options.powerDraw;

    this.envTemp = options.envTemp;

    if (options.stopWarmUpAfter) {
      this.stopWarmUpAfter = options.stopWarmUpAfter;
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

      hashboards: this.hashboards.map((hashboard) => {
        return {
          id: hashboard.id,
          hashrate: getRangeOrNumberValue(hashboard.hashrate),
          temperature: getRangeOrNumberValue(hashboard.temperature),
          fanSpeed: {
            in: getRangeOrNumberValue(hashboard.fanSpeed.in),
            out: getRangeOrNumberValue(hashboard.fanSpeed.out),
          },
        };
      }),
    };

    // get node process uptime in minutes
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
