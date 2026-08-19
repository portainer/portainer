import { commandStringToArray } from '@/docker/helpers/containers';

import { CreateContainerRequest } from '../types';

import { Values } from './types';
import { LogConfig } from './LoggerConfig';
import { ConsoleConfig, ConsoleSetting } from './ConsoleSettings';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values
): CreateContainerRequest {
  const config = {
    ...oldConfig,

    HostConfig: {
      ...oldConfig.HostConfig,
      LogConfig: getLogConfig(values.logConfig),
    },
    User: values.user,
    WorkingDir: values.workingDir,
    ...getConsoleConfig(values.console),
  } satisfies CreateContainerRequest;

  if (values.cmd) {
    config.Cmd = commandStringToArray(values.cmd);
  } else if (values.cmd === null) {
    delete config.Cmd;
  }

  if (values.entrypoint) {
    config.Entrypoint = commandStringToArray(values.entrypoint);
  } else if (values.entrypoint === null) {
    delete config.Entrypoint;
  }

  // don't include LogConfig object if "Default logging driver" (type === '') is selected
  if (values.logConfig.type === '') {
    delete config.HostConfig.LogConfig;
  }

  return config;
}

export function getConsoleConfig(value: ConsoleSetting): ConsoleConfig {
  switch (value) {
    case 'both':
      return { OpenStdin: true, Tty: true };
    case 'interactive':
      return { OpenStdin: true, Tty: false };
    case 'tty':
      return { OpenStdin: false, Tty: true };
    case 'none':
    default:
      return { OpenStdin: false, Tty: false };
  }
}

function getLogConfig(
  value: LogConfig
): CreateContainerRequest['HostConfig']['LogConfig'] {
  return {
    Type: value.type,
    Config: Object.fromEntries(
      value.options.map(({ option, value }) => [option, value])
    ),
    // docker types - requires union while it should allow also custom string for custom plugins
  } as CreateContainerRequest['HostConfig']['LogConfig'];
}
