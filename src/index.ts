import consola from 'consola';
import ms from 'ms';
import config from './config.js';
import Miner from './miner.js';
import BtminerServer from './servers/btminer.js';
import LuciServer from './servers/luci.js';
import ConfigServer from './servers/config.js';

const miner = new Miner(config.miner);
consola.info(
  `WhatsMiner ${miner.model} | MAC: ${miner.mac} | API: ${miner.apiVersion} | FW: ${miner.firmwareVersion}`
);

if (config.commandsControl.syntheticDelay > 0) {
  consola.info(
    `Commands are using a synthetic delay of ${config.commandsControl.syntheticDelay}ms`
  );
}

// Btminer interface
const btminerServer = new BtminerServer(miner, config.servers.btminer);
await btminerServer.start();

// Luci interface
const luciServer = new LuciServer(miner, config.servers.luci);
await luciServer.start();

// Config server
const configServer = new ConfigServer(miner, config.servers.config);
await configServer.start();

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
  } else {
    consola.info(`WhatsMiner ${miner.model} is suspended`);
  }
}, ms('30s'));
