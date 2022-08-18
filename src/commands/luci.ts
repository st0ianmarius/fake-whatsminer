import { App } from '@tinyhttp/app';
import { createHash } from 'node:crypto';
import Miner, { PowerMode } from '../miner.js';

const createAuthCookieHash = (miner: Miner) =>
  createHash('sha256')
    .update(miner.credentials.username + miner.credentials.password)
    .digest('hex');

const registerCommands = (app: App, miner: Miner) => {
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
            <td>${miner.model}</td>
          </tr>
        </table>
        `
    );
  });

  // Auth
  app.post('/cgi-bin/luci', (req, res) => {
    if (
      req.body.luci_username === miner.credentials.username &&
      req.body.luci_password === miner.credentials.password
    ) {
      res.cookie('auth', createAuthCookieHash(miner));
      res.sendStatus(200);
    } else {
      res.status(403).send('Invalid username');
    }
  });

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
  app.post('/cgi-bin/luci/admin/network/btminer', (req, res) => {
    if (req.body) {
      for (let i = 0; i < 3; i++) {
        if (req.body[`cbid.pools.default.pool${i + 1}url`]) {
          miner.pools[i] = {
            url: req.body[`cbid.pools.default.pool${i + 1}url`],
            user: req.body[`cbid.pools.default.pool${i + 1}user`],
            password: req.body[`cbid.pools.default.pool${i + 1}pw`],
          };
        } else {
          miner.pools.splice(i, 1);
        }
      }
    }

    res.sendStatus(200);
  });

  // Btminer Restart Status -> used after changing mining pools
  app.get('/cgi-bin/luci/admin/status/btminerstatus/restart', (_req, res) => {
    res.sendStatus(200);
  });

  // System Reboot
  app.get('/cgi-bin/luci/admin/system/reboot', (_req, res) => {
    res.send('token: reboot-token');
  });
  app.post('/cgi-bin/luci/admin/system/reboot/call', (_req, res) => {
    res.sendStatus(200);
  });

  // Power Mode
  app.post('/cgi-bin/luci/admin/network/btminer/power', (req, res) => {
    if (req.body) {
      const powerModeNum = req.body['cbid.btminer.default.miner_type'];
      if (powerModeNum >= 0) {
        if (powerModeNum === 0) {
          miner.powerMode = PowerMode.Low;
        }

        if (powerModeNum === 1) {
          miner.powerMode = PowerMode.Normal;
        }

        if (powerModeNum === 2) {
          miner.powerMode = PowerMode.High;
        }
      }
    }

    res.sendStatus(200);
  });
  app.get('/cgi-bin/luci/admin/network/btminer/power', (_req, res) => {
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

    res.send(`
          <input type="text" name="token" value="power-token"/>     
          
          <form action="/cgi-bin/luci/admin/network/btminer/power" method="post">
            <input type="text" name="cbid.btminer.default.miner_type" value="${powerModeNum}"/>
          </form>
          
          <input type="checkbox" class="cbi-input-radio" value="${powerModeNum}"
             checked />       
        `);
  });
};

export { registerCommands, createAuthCookieHash };
