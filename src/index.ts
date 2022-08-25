import consola from 'consola';
import ms from 'ms';
import config, { version } from './config.js';
import Miner from './miner.js';
import BtminerServer from './servers/btminer.js';
import LuciServer from './servers/luci.js';
import MinerControlServer from './servers/miner-control.js';

consola.info(`Running on version ${version}`);

const miner = new Miner(config.miner);
consola.info(
  `WhatsMiner ${miner.model} | MAC: ${miner.mac} | Credentials: ${miner.credentials.username}:${miner.credentials.password}`
);

if (config.miner.deadTimeBetweenRestarts) {
  consola.info(
    `Miner dead time between restarts is set at ${config.miner.deadTimeBetweenRestarts} minutes`
  );
}

if (config.miner.stopWarmUpAfter) {
  consola.info(
    `Miner warm up time set to ${config.miner.stopWarmUpAfter} minutes`
  );
}

// Btminer interface
const btminerServer = new BtminerServer(miner, config.servers.btminer);
await btminerServer.start();

// Luci interface
const luciServer = new LuciServer(miner, config.servers.luci);
await luciServer.start();

// Miner Control server
const minerControlServer = new MinerControlServer(
  miner,
  config.servers.minerControl
);
await minerControlServer.start();

// Log miner stats periodically
setInterval(() => {
  if (!miner.isSuspended) {
    const minerStats = miner.getStats();

    const hashrate = minerStats.hashboards.reduce(
      (acc, hb) => acc + hb.hashrate,
      0
    );
    const temperature = (
      minerStats.hashboards.reduce((acc, hb) => acc + hb.temperature, 0) /
      minerStats.hashboards.length
    ).toFixed(0);

    const fanSpeedIn = (
      minerStats.hashboards.reduce((acc, hb) => acc + hb.fanSpeed.in, 0) /
      minerStats.hashboards.length
    ).toFixed(0);
    const fanSpeedOut = (
      minerStats.hashboards.reduce((acc, hb) => acc + hb.fanSpeed.out, 0) /
      minerStats.hashboards.length
    ).toFixed(0);

    consola.info(
      `WhatsMiner ${miner.model} | Power Mode: ${minerStats.powerMode} | Power Draw: ${minerStats.powerDraw}W | Hashrate: ${hashrate} TH/s | Avg. Temp: ${temperature}°C | Env Temp: ${minerStats.envTemp}°C | Fan Speed: ${fanSpeedIn} RPM -> ${fanSpeedOut} RPM`
    );
  }
}, ms('30s'));
