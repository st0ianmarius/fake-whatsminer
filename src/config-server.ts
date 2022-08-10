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

    // TODO: implement endpoints to manipulate miner config in real-time
  }

  public async start() {
    return new Promise<void>((resolve) => {
      this.server.listen(this.port, () => {
        consola.info(`Config server bound on port ${this.port}`);
        resolve();
      });
    });
  }
}

export { ConfigServerOptions };
export default ConfigServer;
