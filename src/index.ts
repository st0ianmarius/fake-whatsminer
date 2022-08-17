import consola from 'consola';
import gradient from 'gradient-string';
import config from './config.js';
import Miner from './miner.js';
import TcpServer from './tcp-server.js';
import LuciServer from './luci-server.js';
import ConfigServer from './config-server.js';

consola.info(gradient.morning('Starting fake WhatsMiner...'));

const miner = new Miner(config.miner);
consola.info(
  `${miner.model} | MAC: ${miner.mac} | API: ${miner.apiVersion} | FW: ${miner.firmwareVersion}`
);

// Btminer interface
const tcpServer = new TcpServer(miner, config.tcpServer);
await tcpServer.start();

// Luci interface
const luciServer = new LuciServer(miner);
await luciServer.start();

// Config server
const configServer = new ConfigServer(miner, config.configServer);
await configServer.start();

consola.info(gradient.morning('Fake WhatsMiner started!'));
