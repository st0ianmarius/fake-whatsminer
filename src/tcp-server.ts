import net from 'node:net';
import consola from 'consola';
import handleTCPCommand from './tcp-cmd-handler.js';
import Miner from './miner.js';

interface TcpServerOptions {
  port: number;
}

class TcpServer {
  private server: net.Server;

  private readonly port: number = 4028;

  constructor(miner: Miner, options: Partial<TcpServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = net.createServer((c) => {
      c.on('data', async (data) => {
        try {
          const dataObj = JSON.parse(data.toString());
          const cmd = dataObj.command ?? dataObj.cmd;

          const resultData = await handleTCPCommand(miner, cmd);
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

export { TcpServerOptions };
export default TcpServer;
