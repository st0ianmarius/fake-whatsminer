import { App } from '@tinyhttp/app';
import consola from 'consola';
import Miner from './miner.js';

interface ConfigServerOptions {
  port: number;
}

class ConfigServer {
  private server: App;

  private readonly port: number = 9000;

  constructor(_miner: Miner, options: Partial<ConfigServerOptions> = {}) {
    if (options.port) {
      this.port = options.port;
    }

    this.server = new App();
  }

  public async start() {
    return new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        consola.info(`Miner config server up and running on port ${this.port}`);
        resolve();
      });
    });
  }
}

export { ConfigServerOptions };
export default ConfigServer;
