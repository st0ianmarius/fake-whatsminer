import https from 'node:https';
import http from 'node:http';
import { App } from '@tinyhttp/app';
import bodyParser from 'body-parser';
import consola from 'consola';
import Miner, { PowerMode } from './miner.js';

const cert = `
-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUR4cAudVor8kgnCvzM7GNnkUw7CgwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTIwMDcxODEyMTg0N1oXDTIwMDgx
NzEyMTg0N1owFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAzD52Zv35l0cJlEXb6lDKiUDgGoAjLr4G/ezoe8Bh2tti
nZnFB0iyQg2FbO/s77a4G79ZSPdluBJHqV78glJddqvja8Ri5GQbCJobZfb/lfqE
pVzdOHcbs22BtxinqWISCNdrLh8ZYPeT3sVQYmPxgSO2lou8RQzS/CNimXa63T8w
asUf8Dol/feQtZ4JLhhGTg6sHgJaG7e5XVTRrwLHADhOg783lgpNpt7lfPySx0wm
TVrgA5NUKtRlo5SI4GwsYWWwIcOGGlaSDrwEesX98jYswaN0E1PijIiQ4pyr5kOz
mVO4AMTCq+MNMclSc4/355N2mF7CUpREaXNZpUq6UwIDAQABo1MwUTAdBgNVHQ4E
FgQU1qm+m218mHzoDbCAywVaj0496X4wHwYDVR0jBBgwFoAU1qm+m218mHzoDbCA
ywVaj0496X4wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAHVC
h3+/FEgU4y5rAhcKCB+x00LSmwpKTY9/daKKAB94gfI3lXZ6pHiuwqpRc78NAtaB
zTUjWLbjyjAMDwKC9GfvioGl+28Cls2gPRWw4K8X9xtavMbjvmrA4KwUFsNHxva4
3aP+29RpDVvMvRH5ggE0SpnclIZd9f6yYd0murJqWJIO+lvwSRG1l6Ugb34yqyZ+
vsw/N1qcj73CZdyqbFjfUVDU2jH7o5Mk33+9q/vMKnm0qeW6EH1h4feh7H3z23fh
cSuzhWGdQLJwgquKK3mES2ik32YdRAB8lfB8Bi4E4pCMXBYq/RPRUONuh/iW/nj/
akMkRhqQbvAVYRZ78Q==
-----END CERTIFICATE-----
`;

const certKey = `
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMPnZm/fmXRwmU
RdvqUMqJQOAagCMuvgb97Oh7wGHa22KdmcUHSLJCDYVs7+zvtrgbv1lI92W4Ekep
XvyCUl12q+NrxGLkZBsImhtl9v+V+oSlXN04dxuzbYG3GKepYhII12suHxlg95Pe
xVBiY/GBI7aWi7xFDNL8I2KZdrrdPzBqxR/wOiX995C1ngkuGEZODqweAlobt7ld
VNGvAscAOE6DvzeWCk2m3uV8/JLHTCZNWuADk1Qq1GWjlIjgbCxhZbAhw4YaVpIO
vAR6xf3yNizBo3QTU+KMiJDinKvmQ7OZU7gAxMKr4w0xyVJzj/fnk3aYXsJSlERp
c1mlSrpTAgMBAAECggEAE4/j/UdUEYYvR7FNN+sXCwBYtpERTZfLyaRYPAoYFUMv
9dJVibYPxL3QyrdMJUWF6rpwDcoMRw4RKQq8+qpy4zvhY2AC7Mcdw7wm5aQ7pJzC
+aekVJUr5QqXAvdsj4+iFJC1Zkx6PMxZsFuLsHDMH8dQ5Khrlt18k8O73OD/UtNf
doS1KgnwXdqXEJbJTaMv1Wc0CfWPp1E5MMfI9T1l/rVO0Ah/+WXSW47t5b4pwi5t
r4XLCBFVfeRbhSUUu4g1FdbiC4khwgM624Q5LBAdfGQrTy/7eoayrbALztG8plM8
Teg39TY9LutBqLW5MtzZ/dHw6sK0n3DaMSLNWGWiEQKBgQD/3A+H1yCG05+m/7X/
tS6RvsCveXLWBJqeIjIOhkK5OzSLWpZOw1g263AL97g12pZJC1CktE7i56A/Ga7x
wSAOAD+qgZRt3ncpzUlTFr9cegGZeljxHCspczYmCSPn9u5Y5luvR56pxN9qzeFx
wg2TSxIPdiD5l1pnWhr/2vzdiQKBgQDMWybSrIeEgFFEu5TXqHJkuMe/09hplfTV
AEkmjF7bO+2OAWxyePrGiSKGS0+O3ur4YZZNLbpoPXWXfUUm3DXdxqklitjIvYZh
qLWXUXUh6vwu+f5sL/a2t7zNWQ/kHF0JaUBO+efN5P9zaJ8AMgRggW2C1o/dxROK
rVeD890d+wKBgQDg6Id6aF++RP59ZSCOA61JDn4AgeixOuDTismnvNugSev5Z4ri
95JuzGz1CC+Un24mDV05OwpxKRzS+veuqY5M4GkWr8tS/RCQ3VTMRh2248TOLh9K
6vECAbWin7xBZu3DldMYdAODxnyCPTIktmkKhh39G2EHJcWhPjKnn89RyQKBgBaO
kTB7/tFvYIkXs4xCea4If3P7LE4rUUUZrPlmUSod6VDdc10HYZb8mCT+tx9sF7+m
9fI68/KBpjM8jp+FeySpww3zz44I7YZmGvVC9ozx5ThCPAUxHih5C4wXIpvpTZO2
XHTbPO0LM+9HQxXAb58/ahkhGew+zrNmAtz71BJ1AoGBAMw+RvxZ/GLQiBqg2xSy
cJxCo5e5sVzuwgYTOX8ZacQYk1UJhPm/dt3WSt4OynIhyCWkV5w5pLMR5hTzuQWw
vfUIn8xJDI+ijQWmAXPAgmZF+o219KFMghyS03Uu/BMiuCx/hDuVvwlEKsgW5dkx
0Tqfn5GrjoBJeS+IkN2dByvl
-----END PRIVATE KEY-----
`;

class LuciServer {
  private server: https.Server;

  constructor(miner: Miner) {
    const app = new App({
      settings: {
        networkExtensions: true,
      },
    });

    app.use(bodyParser.urlencoded({ extended: true }));

    // Auth
    app.post('/cgi-bin/luci', (_req, res) => {
      res.cookie('auth', '1');
      res.sendStatus(200);
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

    this.server = https.createServer({
      cert,
      key: certKey,
      rejectUnauthorized: false,
    });
    this.server.on('request', app.attach);
  }

  public async start() {
    return new Promise<void>((resolve) => {
      this.server.listen(443, '0.0.0.0', () => {
        http
          .createServer((req, res) => {
            res.writeHead(301, {
              Location: 'https://' + req.headers.host + req.url,
            });
            res.end();
          })
          .listen(80);

        consola.info(`Luci interface up and running on port 443`);
        resolve();
      });
    });
  }
}

export default LuciServer;
