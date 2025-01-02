import { DockerNetwork } from '@/react/docker/networks/types';

import { ContainerDetailsJSON } from '../../queries/useContainer';
import { ContainerListViewModel } from '../../types';

import { CONTAINER_MODE, Values } from './types';

export function getDefaultViewModel(isWindows: boolean, isPodman?: boolean) {
  const networkMode = getDefaultNetworkMode(isWindows, isPodman);
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

export function getDefaultNetworkMode(isWindows: boolean, isPodman?: boolean) {
  if (isWindows) return 'nat';
  if (isPodman) return 'podman';
  return 'bridge';
}

export function toViewModel(
  config: ContainerDetailsJSON,
  networks: Array<DockerNetwork>,
  runningContainers: Array<ContainerListViewModel> = [],
  isPodman?: boolean
): Values {
  const dns = config.HostConfig?.Dns;
  const [primaryDns = '', secondaryDns = ''] = dns || [];

  const hostsFileEntries = config.HostConfig?.ExtraHosts || [];

  const [networkMode, container = ''] = getNetworkMode(
    config,
    networks,
    runningContainers,
    isPodman
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

export function getNetworkMode(
  config: ContainerDetailsJSON,
  networks: Array<DockerNetwork>,
  runningContainers: Array<ContainerListViewModel> = [],
  isPodman?: boolean
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
    if (isPodman && networkMode === 'bridge') {
      return ['podman'] as const;
    }
    return [networkMode] as const;
  }

  if (
    networkNames.includes('bridge') &&
    (!networkMode || networkMode === 'default' || networkMode === 'bridge')
  ) {
    if (isPodman) {
      return ['podman'] as const;
    }
    return ['bridge'] as const;
  }

  if (networkNames.includes('nat')) {
    return ['nat'] as const;
  }

  return [networks[0].Name] as const;
}
