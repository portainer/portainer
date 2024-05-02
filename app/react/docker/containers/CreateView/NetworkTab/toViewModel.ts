import { DockerNetwork } from '@/react/docker/networks/types';

import { ContainerJSON } from '../../queries/container';
import { DockerContainer } from '../../types';

import { CONTAINER_MODE, Values } from './types';

export function getDefaultViewModel(isWindows: boolean) {
  const networkMode = isWindows ? 'nat' : 'bridge';
  return {
    networkMode,
    hostname: '',
    domain: '',
    macAddress: '',
    ipv4Address: '',
    ipv6Address: '',
    primaryDns: '',
    secondaryDns: '',
    hostsFileEntries: [],
    container: '',
  };
}

export function toViewModel(
  config: ContainerJSON,
  networks: Array<DockerNetwork>,
  runningContainers: Array<DockerContainer> = []
): Values {
  const dns = config.HostConfig?.Dns;
  const [primaryDns = '', secondaryDns = ''] = dns || [];

  const hostsFileEntries = config.HostConfig?.ExtraHosts || [];

  const [networkMode, container = ''] = getNetworkMode(
    config,
    networks,
    runningContainers
  );

  const networkSettings = config.NetworkSettings?.Networks?.[networkMode];
  let ipv4Address = '';
  let ipv6Address = '';
  if (networkSettings && networkSettings.IPAMConfig) {
    ipv4Address = networkSettings.IPAMConfig.IPv4Address || '';
    ipv6Address = networkSettings.IPAMConfig.IPv6Address || '';
  }

  const macAddress = networkSettings?.MacAddress || '';

  return {
    networkMode,
    hostname: config.Config?.Hostname || '',
    domain: config.Config?.Domainname || '',
    macAddress,
    ipv4Address,
    ipv6Address,
    primaryDns,
    secondaryDns,
    hostsFileEntries,
    container,
  };
}

function getNetworkMode(
  config: ContainerJSON,
  networks: Array<DockerNetwork>,
  runningContainers: Array<DockerContainer> = []
) {
  let networkMode = config.HostConfig?.NetworkMode || '';
  if (!networkMode) {
    const networks = Object.keys(config.NetworkSettings?.Networks || {});
    if (networks.length > 0) {
      [networkMode] = networks;
    }
  }

  if (networkMode.startsWith('container:')) {
    const networkContainerId = networkMode.split(/^container:/)[1];
    const container =
      runningContainers.find((c) => c.Id === networkContainerId)?.Names[0] ||
      '';
    return [CONTAINER_MODE, container] as const;
  }

  const networkNames = networks.map((n) => n.Name);

  if (networkNames.includes(networkMode)) {
    return [networkMode] as const;
  }

  if (
    networkNames.includes('bridge') &&
    (!networkMode || networkMode === 'default' || networkMode === 'bridge')
  ) {
    return ['bridge'] as const;
  }

  if (networkNames.includes('nat')) {
    return ['nat'] as const;
  }

  return [networks[0].Name] as const;
}
