import net from 'node:net';
import consola from 'consola';
import Miner from '../miner';
import { handleCommand } from '../commands/btminer.js';

interface BtminerServerOptions {
  port: number;
}

class BtminerServer {
  private server: net.Server;

  private readonly port: number = 4028;

  constructor(miner: Miner, options: Partial<BtminerServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = net.createServer((c) => {
      c.on('data', async (data) => {
        try {
          const dataObj = JSON.parse(data.toString());
          const cmd = dataObj.command ?? dataObj.cmd;

          const resultData = await handleCommand(miner, cmd);
          if (resultData) {
            c.write(JSON.stringify(resultData));
            c.end();
          }
        } catch (err) {
          c.write(
            JSON.stringify({
              err: (err as Error).message,
            })
          );
        }
      });

      c.on('error', (err) => {
        consola.error(`TCP client error: ${err}`);
      });
    });

    this.server.on('error', (err: any) => {
      consola.error(`TCP server error. ${err}`);
    });
  }

  public async start() {
    return new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        consola.info(`Btminer interface up and running on port ${this.port}`);
        resolve();
      });
    });
  }
}

export { BtminerServerOptions };
export default BtminerServer;
