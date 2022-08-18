import net from 'node:net';
import { createDecipheriv, createHash } from 'node:crypto';
import consola from 'consola';
import Miner from '../miner';
import { handleCommand } from '../commands/btminer.js';
import cryptmd5 from '../utils/cryptmd5.js';

interface BtminerServerOptions {
  port: number;
}

class BtminerServer {
  private server: net.Server;

  private readonly port: number = 4028;

  private getEncryptionKey(miner: Miner) {
    const rawKeyCrypt = cryptmd5(miner.credentials.password, 'salt');
    const key = rawKeyCrypt.split('$')[3];
    if (key) {
      return createHash('sha256').update(key).digest('hex');
    }

    return false;
  }

  constructor(miner: Miner, options: Partial<BtminerServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = net.createServer((c) => {
      c.on('data', async (data) => {
        try {
          const dataObj = JSON.parse(data.toString());

          let msgData = dataObj;
          if (dataObj.enc) {
            const key = this.getEncryptionKey(miner);
            if (key) {
              const keyBuf = Buffer.from(key, 'hex');
              const decipher = createDecipheriv(
                'aes-256-ecb',
                keyBuf.slice(0, 32),
                Buffer.from([])
              );
              decipher.setAutoPadding(false);

              let rawMsg = Buffer.concat([
                decipher.update(dataObj.data, 'base64'),
                decipher.final(),
              ]).toString();

              if (rawMsg) {
                // Remove backspaces
                while (rawMsg.indexOf('\b') !== -1) {
                  // eslint-disable-next-line no-control-regex
                  rawMsg = rawMsg.replace(/.?\x08/, ' '); // 0x08 is the ASCII code for \b
                }

                // Remove tabs
                rawMsg = rawMsg.replace(/\t/g, '');

                // Removing backspaces, also removes the last ending '}'
                if (!rawMsg.endsWith('}')) {
                  rawMsg += '}';
                }

                msgData = JSON.parse(rawMsg);
              }
            }
          }

          const cmd = msgData.command ?? msgData.cmd;

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
