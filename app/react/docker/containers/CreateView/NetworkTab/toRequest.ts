import { CreateContainerRequest } from '../types';

import { CONTAINER_MODE, Values } from './types';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values,
  fromContainerId: string
): CreateContainerRequest {
  let mode = values.networkMode;
  let hostName = values.hostname;
  if (mode === CONTAINER_MODE && values.container) {
    mode += `:${values.container}`;
    hostName = '';
  }

  return {
    ...oldConfig,
    Hostname: hostName,
    Domainname: values.domain,
    MacAddress: values.macAddress,
    HostConfig: {
      ...oldConfig.HostConfig,
      NetworkMode: mode,
      Dns: [values.primaryDns, values.secondaryDns].filter((d) => d),
      ExtraHosts: values.hostsFileEntries,
    },
    NetworkingConfig: {
      ...oldConfig.NetworkingConfig,
      EndpointsConfig: {
        [mode]: {
          IPAMConfig: {
            IPv4Address: values.ipv4Address,
            IPv6Address: values.ipv6Address,
          },
          Aliases: oldConfig.NetworkingConfig.EndpointsConfig?.[
            mode
          ]?.Aliases?.filter((al) => !fromContainerId.startsWith(al)),
        },
      },
    },
  };
}
