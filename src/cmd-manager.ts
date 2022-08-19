enum Command {
  Detect = 'Detect',
  GetStats = 'GetStats',
  GetSystemInfo = 'GetSystemInfo',
  Suspend = 'Suspend',
  Resume = 'Resume',
  SystemReboot = 'SystemReboot',
}

interface CommandOptions {
  executeDelay?: number;
  consecutiveFails?: number;
  options: Record<string, any>;
}

interface CommandManagerOptions {
  globalExecuteDelay?: number;
  commands?: Record<string, CommandOptions>;
}

class CmdManager {
  private executeDelay = 0;

  private commandsOptions = new Map<string, CommandOptions>();

  constructor(options: CommandManagerOptions) {
    if (options.globalExecuteDelay) {
      this.executeDelay = options.globalExecuteDelay;
    }

    if (options.commands) {
      // eslint-disable-next-line guard-for-in
      for (const cmd in options.commands) {
        this.commandsOptions.set(cmd, options.commands[cmd] as CommandOptions);
      }
    }
  }

  public async execute(cmd: Command): Promise<void> {
    let { executeDelay } = this;

    const cmdOpts = this.commandsOptions.get(cmd);
    if (cmdOpts) {
      if (cmdOpts.executeDelay) {
        executeDelay = cmdOpts.executeDelay;
      }
    }

    if (executeDelay > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, executeDelay);
      });
    }
  }
}

export { Command };
export default CmdManager;
