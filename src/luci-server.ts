import { App } from '@tinyhttp/app';
import consola from 'consola';
import Miner, { PowerMode } from './miner.js';

class LuciServer {
  private server: App;

  private readonly port: number = 80;

  constructor(miner: Miner) {
    this.server = new App();

    // auth
    this.server.post('/cgi-bin/luci', (_req, res) => {
      res.send(200);
    });

    // btminer config
    this.server.get('/cgi-bin/luci/admin/network/btminer', (_req, res) => {
      res.send(200);
    });
    this.server.post('/cgi-bin/luci/admin/network/btminer', (_req, res) => {
      res.send(200);
    });

    // btminer restart status
    // used after changing pools
    this.server.get(
      '/cgi-bin/luci/admin/status/btminerstatus/restart',
      (_req, res) => {
        res.send(200);
      }
    );

    // btminer power mode
    this.server.post(
      '/cgi-bin/luci/admin/network/btminer/power',
      (_req, res) => {
        // TODO: change power mode
        miner.powerMode = PowerMode.Normal;

        res.send(200);
      }
    );
  }

  public async start() {
    return new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        consola.info(`Luci server bound on port ${this.port}`);
        resolve();
      });
    });
  }
}

export default LuciServer;
