import fs from 'node:fs';
import env from './env.js';
import { MinerOptions } from './miner.js';
import { BtminerServerOptions } from './servers/btminer';
import { LuciServerOptions } from './servers/luci';
import { MinerControlServerOptions } from './servers/miner-control';

interface Config {
  miner: MinerOptions;
  servers: {
    btminer: BtminerServerOptions;
    luci: LuciServerOptions;
    minerControl: MinerControlServerOptions;
  };
}

const config: Config = JSON.parse(fs.readFileSync(env.CONFIG, 'utf8'));
const { version } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

export { Config, version };
export default config;
