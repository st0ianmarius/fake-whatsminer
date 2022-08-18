import consola from 'consola';
import config from './config.js';
import Miner from './miner.js';

enum Command {
  Detect = 'Detect',
  GetStats = 'GetStats',
  GetSystemInfo = 'GetSysInfo',
  Suspend = 'Suspend',
  Resume = 'Resume',
  SystemReboot = 'Reboot',
}

const customCommandsExecution = new Map<
  Command,
  (miner: Miner, custom: Record<string, any>) => Promise<void>
>([
  [
    Command.Suspend,
    async (
      miner: Miner,
      options: {
        keepUnitRunning?: boolean;
      }
    ) => {
      if (options.keepUnitRunning) {
        consola.info(
          `[${Command.Suspend}] Received command to suspend miner, but keeping unit running due to custom opt`
        );
        return;
      }

      miner.isSuspended = true;

      consola.info(`[${Command.Suspend}] Miner suspended`);
    },
  ],
  [
    Command.Resume,
    async (
      miner: Miner,
      options: {
        keepUnitSuspended?: boolean;
      }
    ) => {
      if (options.keepUnitSuspended) {
        consola.info(
          `[${Command.Resume}] Received command to resume miner, but keeping unit suspended due to custom opt`
        );
        return;
      }

      miner.isSuspended = false;

      consola.info(`[${Command.Resume}] Miner resumed`);
    },
  ],
  [
    Command.SystemReboot,
    async (
      miner: Miner,
      options: {
        sleepFor?: number;
      }
    ) => {
      if (options.sleepFor) {
        consola.info(
          `[${Command.Resume}] Miner rebooting and going to sleep for ${options.sleepFor} minutes`
        );
        miner.sleepUntil = new Date(Date.now() + options.sleepFor * 60 * 1000);
      }

      consola.info(`[${Command.SystemReboot}] Miner rebooted`);
    },
  ],
]);

const executeCommand = async (
  cmd: Command,
  miner: Miner,
  cmdExecutor: PromiseLike<unknown>
): Promise<any> => {
  if (config.commandsControl.syntheticDelay > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, config.commandsControl.syntheticDelay);
    });
  }

  if (customCommandsExecution.has(cmd)) {
    const customExecutor = customCommandsExecution.get(cmd);
    if (customExecutor) {
      const customOpts =
        config.commandsControl.commands.find((c) => c.cmd === cmd) ?? {};
      await customExecutor(miner, customOpts);
    }
  }

  return cmdExecutor;
};

export { Command, executeCommand };
