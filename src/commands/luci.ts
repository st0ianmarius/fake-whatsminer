import { FastifyInstance } from 'fastify';
import consola from 'consola';
import { createHash } from 'node:crypto';
import Miner, { PowerMode } from '../miner.js';

const createAuthCookieHash = (miner: Miner) =>
  createHash('sha256')
    .update(miner.credentials.username + miner.credentials.password)
    .digest('hex');

const registerCommands = (app: FastifyInstance, miner: Miner) => {
  // Detect
  app.get('/cgi-bin/luci/admin/network/iface_status/lan', (_req, res) => {
    res.send([
      {
        macaddr: miner.mac,
      },
    ]);
  });
  app.get('/cgi-bin/luci/admin/status/overview', (_req, res) => {
    res.send(
      `
        <table>
          <tr>
            <td>WhatsMiner ${miner.model}</td>
          </tr>
        </table>
        `
    );
  });

  // Auth
  app.post<{ Body: { luci_username: string; luci_password: string } }>(
    '/cgi-bin/luci',
    (req, reply) => {
      if (
        req.body &&
        req.body.luci_username === miner.credentials.username &&
        req.body.luci_password === miner.credentials.password
      ) {
        reply.cookie('auth', createAuthCookieHash(miner));
        reply.code(200).send();
      } else {
        reply.code(403).send('Invalid username');
      }
    }
  );

  // Config
  app.get('/cgi-bin/luci/admin/network/btminer', (_req, res) => {
    res.send(`
          <input type="text" name="token" value="pool-token"/>     
          ${miner.pools
            .map(
              (pool, index) => `
              <input type="text" name="cbid.pools.default.pool${
                index + 1
              }url" value="${pool.url}"/>
              <input type="text" name="cbid.pools.default.pool${
                index + 1
              }user" value="${pool.user}"/>
              <input type="text" name="cbid.pools.default.pool${
                index + 1
              }pw" value="${pool.password}"/>
            `
            )
            .join('')}
        `);
  });
  app.post('/cgi-bin/luci/admin/network/btminer', (req, reply) => {
    if (req.body) {
      const body = req.body as any;
      for (let i = 0; i < 3; i++) {
        if (body[`cbid.pools.default.pool${i + 1}url`]) {
          miner.pools[i] = {
            url: body[`cbid.pools.default.pool${i + 1}url`],
            user: body[`cbid.pools.default.pool${i + 1}user`],
            password: body[`cbid.pools.default.pool${i + 1}pw`],
          };
        } else {
          miner.pools.splice(i, 1);
        }
      }

      consola.info(
        `Miner config has been updated. Pools: ${miner.pools
          .map((p, i) => `[{${i}} ${p.url} <-> ${p.user}]`)
          .join(' ')}`
      );
    }

    reply.code(200).send();
  });

  // Btminer Restart Status -> used after changing mining pools
  app.get('/cgi-bin/luci/admin/status/btminerstatus/restart', (_req, reply) => {
    reply.code(200).send();
  });

  // System Reboot
  app.get('/cgi-bin/luci/admin/system/reboot', (_req) => 'token: reboot-token');
  app.post('/cgi-bin/luci/admin/system/reboot/call', (_req, reply) => {
    reply.code(200).send();
  });

  // Power Mode
  app.post('/cgi-bin/luci/admin/network/btminer/power', (req, reply) => {
    if (req.body) {
      const body = req.body as any;
      const powerModeNum = Number(body['cbid.btminer.default.miner_type']);
      if (!Number.isNaN(powerModeNum)) {
        let newPowerMode: PowerMode | null = null;
        if (powerModeNum === 0) {
          newPowerMode = PowerMode.Low;
        }

        if (powerModeNum === 1) {
          newPowerMode = PowerMode.Normal;
        }

        if (powerModeNum === 2) {
          newPowerMode = PowerMode.High;
        }

        if (newPowerMode) {
          if (newPowerMode !== miner.powerMode) {
            miner.powerMode = newPowerMode;
            consola.info(`Miner power mode set to ${miner.powerMode}`);
          } else {
            consola.warn('Miner power mode is the same');
          }
        } else {
          consola.error(`Received invalid power mode ${powerModeNum} on Luci`);
        }
      }
    }

    reply.code(200).send();
  });
  app.get('/cgi-bin/luci/admin/network/btminer/power', () => {
    let powerModeNum: number;
    switch (miner.powerMode) {
      case PowerMode.Low:
        powerModeNum = 0;
        break;
      case PowerMode.Normal:
        powerModeNum = 1;
        break;
      case PowerMode.High:
        powerModeNum = 2;
        break;
      default:
        powerModeNum = 1;
    }

    return `
          <input type="text" name="token" value="power-token"/>     
          
          <form action="/cgi-bin/luci/admin/network/btminer/power" method="post">
            <input type="text" name="cbid.btminer.default.miner_type" value="${powerModeNum}"/>
          </form>
          
          <div class="cbi-value-title">
            <span>Power Mode</span>
          </div>
          
          <input type="checkbox" class="cbi-input-radio" value="${powerModeNum}"
             checked />       
        `;
  });
};

export { registerCommands, createAuthCookieHash };
