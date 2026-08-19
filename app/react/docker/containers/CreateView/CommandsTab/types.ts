import { ConsoleSetting } from './ConsoleSettings';
import { LogConfig } from './LoggerConfig';

export interface Values {
  cmd: string | null;
  entrypoint: string | null;
  workingDir: string;
  user: string;
  console: ConsoleSetting;
  logConfig: LogConfig;
}
