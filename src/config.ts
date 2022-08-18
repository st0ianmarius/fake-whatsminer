import fs from 'node:fs';
import env from './env.js';
import { MinerOptions } from './miner.js';
import { BtminerServerOptions } from './servers/btminer';
import { LuciServerOptions } from './servers/luci';
import { ConfigServerOptions } from './servers/config';

interface Config {
  miner: MinerOptions;
  servers: {
    btminer: BtminerServerOptions;
    luci: LuciServerOptions;
    config: ConfigServerOptions;
  };
}

const config: Config = JSON.parse(fs.readFileSync(env.CONFIG, 'utf8'));

export { Config };
export default config;
