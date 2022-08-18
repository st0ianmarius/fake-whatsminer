import fs from 'node:fs';
import env from './env.js';
import { MinerOptions } from './miner.js';
import { BtminerServerOptions } from './servers/btminer';
import { LuciServerOptions } from './servers/luci';
import { ConfigServerOptions } from './servers/config';

interface CommandsControl {
  syntheticDelay: number;
  commands: {
    cmd: string;
    options: Record<string, any>;
  }[];
}

interface Config {
  miner: MinerOptions;
  servers: {
    btminer: BtminerServerOptions;
    luci: LuciServerOptions;
    config: ConfigServerOptions;
  };
  commandsControl: CommandsControl;
}

const config: Config = JSON.parse(fs.readFileSync(env.CONFIG, 'utf8'));

export { Config };
export default config;
