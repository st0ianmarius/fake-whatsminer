import fs from 'node:fs';
import { MinerOptions } from './miner.js';
import { TcpServerOptions } from './tcp-server.js';
import { ConfigServerOptions } from './config-server.js';

interface Config {
  miner: MinerOptions;
  configServer: ConfigServerOptions;
  tcpServer: TcpServerOptions;
}

const configPath = process.env['CONFIG'] ?? './config.json';

const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export { Config };
export default config;
