import fs from 'node:fs';
import { MinerOptions } from './miner.js';
import { BtminerServerOptions } from './servers/btminer';
import { LuciServerOptions } from './servers/luci';
import { ConfigServerOptions } from './servers/config';

interface CommandsControl {
  syntheticDelay: number;
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

const configPath = process.env['CONFIG'] ?? './config.json';

const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export { Config };
export default config;
