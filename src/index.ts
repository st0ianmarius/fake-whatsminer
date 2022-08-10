import consola from 'consola';
import config from './config.js';
import Miner from './miner.js';
import TcpServer from './tcp-server.js';
import LuciServer from './luci-server.js';
import ConfigServer from './config-server.js';

const miner = new Miner(config.miner);

// whatsminer tcp interface
const tcpServer = new TcpServer(miner, config.tcpServer);
await tcpServer.start();

// whatsminer luci interface
const luciServer = new LuciServer(miner);
await luciServer.start();

// config server
const configServer = new ConfigServer(miner, config.configServer);
await configServer.start();

consola.info('Fake whatsminer is running');
consola.info(miner.getStats());
