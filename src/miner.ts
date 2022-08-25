import env from './env.js';
import consola from 'consola';
import is from '@sindresorhus/is';
import { add, isAfter } from 'date-fns';

interface Range {
  min: number;
  max: number;
}

type RangeOrNumber = Range | number;

type PoolShare =
  | {
      incrementBy: number;
    }
  | number;

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
  poolShares: {
    accepted: PoolShare;
    rejected: PoolShare;
  };
  chipFrequency: RangeOrNumber;
  meta: {
    effectiveChips: number;
  };
}

interface HashboardState {
  id: number;
  poolShares: {
    accepted: number;
    rejected: number;
  };
}

interface MinerOptions {
  mac: string;
  model: string;

  credentials: MinerCredentials;

  deadTimeBetweenRestarts?: number;

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
    poolShares: {
      accepted: number;
      rejected: number;
    };
    chipFrequency: number;
    meta: {
      effectiveChips: number;
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

  miningStartDate: Date = new Date();

  rebootedAt: Date | null = null;
  deadTimeBetweenRestarts = 1; // In minutes

  isWarmingUp: boolean = true;
  stopWarmUpAfter: number = 5; // In minutes

  hashboards: Hashboard[];

  hashboardsState: HashboardState[];

  pools: MiningPool[] = [];

  errorCodes: number[] = [];

  constructor(options: MinerOptions) {
    this.mac = options.mac;
    if (env.MINER_MAC) {
      this.mac = env.MINER_MAC;
    }

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

    if (options.deadTimeBetweenRestarts) {
      this.deadTimeBetweenRestarts = options.deadTimeBetweenRestarts;
    }

    if (options.errorCodes) {
      this.errorCodes = options.errorCodes;
    }

    if (options.pools) {
      this.pools = options.pools;
    }

    this.hashboards = options.hashboards;
    this.hashboardsState = this.hashboards.map((board) => {
      const state = {
        id: board.id,
        poolShares: {
          accepted: 0,
          rejected: 0,
        },
      };

      if (is.number(board.poolShares.accepted)) {
        state.poolShares.accepted = board.poolShares.accepted;
      }

      if (is.number(board.poolShares.rejected)) {
        state.poolShares.rejected = board.poolShares.rejected;
      }

      return state;
    });
  }

  getStats(): MinerStats {
    const stats: Partial<MinerStats> = {
      mac: this.mac,
      model: this.model,

      powerMode: this.powerMode,
      powerDraw: getRangeOrNumberValue(this.powerDraw),

      envTemp: getRangeOrNumberValue(this.envTemp),

      hashboards: this.hashboards.map((hashboard) => {
        const poolShares = {
          accepted: 0,
          rejected: 0,
        };

        const boardState = this.hashboardsState.find(
          (b) => b.id === hashboard.id
        );
        if (boardState) {
          if (is.object(hashboard.poolShares.accepted)) {
            boardState.poolShares.accepted +=
              hashboard.poolShares.accepted.incrementBy;
          }

          if (is.object(hashboard.poolShares.rejected)) {
            boardState.poolShares.rejected +=
              hashboard.poolShares.rejected.incrementBy;
          }

          poolShares.accepted = boardState.poolShares.accepted;
          poolShares.rejected = boardState.poolShares.rejected;
        }

        return {
          poolShares,
          id: hashboard.id,
          hashrate: getRangeOrNumberValue(hashboard.hashrate),
          temperature: getRangeOrNumberValue(hashboard.temperature),
          fanSpeed: {
            in: getRangeOrNumberValue(hashboard.fanSpeed.in),
            out: getRangeOrNumberValue(hashboard.fanSpeed.out),
          },
          chipFrequency: getRangeOrNumberValue(hashboard.chipFrequency),
          meta: hashboard.meta,
        };
      }),
    };

    if (this.isWarmingUp) {
      const stopWarmupDate = add(this.miningStartDate, {
        minutes: this.stopWarmUpAfter,
      });
      const now = new Date();
      if (isAfter(now, stopWarmupDate)) {
        consola.info('Miner is moving out of warmup phase');
        this.isWarmingUp = false;
      }
    }

    stats.isWarmingUp = this.isWarmingUp;

    return stats as MinerStats;
  }

  public getFullStats() {
    return {
      ...this.getStats(),
      ...{
        isSuspended: this.isSuspended,
        isWarmingUp: this.isWarmingUp,
        pools: this.pools,
        errorCodes: this.errorCodes,
      },
    };
  }

  public getConfig() {
    return {
      model: this.model,
      mac: this.mac,

      credentials: this.credentials,

      apiVersion: this.apiVersion,
      firmwareVersion: this.firmwareVersion,

      powerMode: this.powerMode,
      powerDraw: this.powerDraw,

      psu: this.psu,

      envTemp: this.envTemp,

      isSuspended: this.isSuspended,
      isWarmingUp: this.isWarmingUp,

      errorCodes: this.errorCodes,

      deadTimeBetweenRestarts: this.deadTimeBetweenRestarts,
      stopWarmUpAfter: this.stopWarmUpAfter,

      pools: this.pools,
      hashboards: this.hashboards,
    };
  }

  public isInRebootMode() {
    let dead = false;
    if (this.rebootedAt && this.deadTimeBetweenRestarts > 0) {
      const onlineAt = add(this.rebootedAt, {
        minutes: this.deadTimeBetweenRestarts,
      });
      if (onlineAt.getTime() > new Date().getTime()) {
        dead = true;
      } else {
        this.rebootedAt = null;
        consola.info('Miner back online after restart');
      }
    }

    return dead;
  }
}

export { PowerMode, MinerOptions, RangeOrNumber, MiningPool, Hashboard };
export default Miner;
