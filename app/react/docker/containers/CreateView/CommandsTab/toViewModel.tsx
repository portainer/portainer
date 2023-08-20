import { HostConfig } from 'docker-types/generated/1.41';

import { commandArrayToString } from '@/docker/helpers/containers';

import { ContainerJSON } from '../../queries/container';

import { ConsoleConfig, ConsoleSetting } from './ConsoleSettings';
import { LogConfig } from './LoggerConfig';
import { Values } from './types';

export function getDefaultViewModel(): Values {
  return {
    cmd: null,
    entrypoint: null,
    user: '',
    workingDir: '',
    console: 'none',
    logConfig: getLogConfig(),
  };
}

export function toViewModel(config: ContainerJSON): Values {
  if (!config.Config) {
    return getDefaultViewModel();
  }

  return {
    cmd: config.Config.Cmd ? commandArrayToString(config.Config.Cmd) : null,
    entrypoint: config.Config.Entrypoint
      ? commandArrayToString(config.Config.Entrypoint)
      : null,
    user: config.Config.User || '',
    workingDir: config.Config.WorkingDir || '',
    console: config ? getConsoleSetting(config.Config) : 'none',
    logConfig: getLogConfig(config.HostConfig?.LogConfig),
  };
}

function getLogConfig(value?: HostConfig['LogConfig']): LogConfig {
  if (!value || !value.Type) {
    return {
      type: 'none',
      options: [],
    };
  }

  return {
    type: value.Type,
    options: Object.entries(value.Config || {}).map(([option, value]) => ({
      option,
      value,
    })),
  };
}

function getConsoleSetting(value: ConsoleConfig): ConsoleSetting {
  if (value.OpenStdin && value.Tty) {
    return 'both';
  }

  if (!value.OpenStdin && value.Tty) {
    return 'tty';
  }

  if (value.OpenStdin && !value.Tty) {
    return 'interactive';
  }

  return 'none';
}
