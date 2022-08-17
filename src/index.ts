import consola from 'consola';
import config from './config.js';
import Miner from './miner.js';
import BtminerServer from './servers/btminer.js';
import LuciServer from './servers/luci.js';
import ConfigServer from './servers/config.js';

consola.info('Starting fake WhatsMiner...');

const miner = new Miner(config.miner);
consola.info(
  `${miner.model} | MAC: ${miner.mac} | API: ${miner.apiVersion} | FW: ${miner.firmwareVersion}`
);

if (config.commandsControl.syntheticDelay > 0) {
  consola.info(
    `Commands are using a synthetic delay of ${config.commandsControl.syntheticDelay}ms`
  );
}

consola.info('Starting servers...');

// Btminer interface
const btminerServer = new BtminerServer(miner, config.servers.btminer);
await btminerServer.start();

// Luci interface
const luciServer = new LuciServer(miner, config.servers.luci);
await luciServer.start();

// Config server
const configServer = new ConfigServer(miner, config.servers.config);
await configServer.start();

consola.success('Fake WhatsMiner is ready!');
