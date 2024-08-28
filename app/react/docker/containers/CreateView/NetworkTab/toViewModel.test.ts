import { describe, it, expect } from 'vitest';

import { DockerNetwork } from '@/react/docker/networks/types';

import { ContainerListViewModel } from '../../types';
import { ContainerDetailsJSON } from '../../queries/useContainer';

import { getDefaultViewModel, getNetworkMode } from './toViewModel';

describe('getDefaultViewModel', () => {
  it('should return the correct default view model for Windows', () => {
    const result = getDefaultViewModel(true);
    expect(result).toEqual({
      networkMode: 'nat',
      hostname: '',
      domain: '',
      macAddress: '',
      ipv4Address: '',
      ipv6Address: '',
      primaryDns: '',
      secondaryDns: '',
      hostsFileEntries: [],
      container: '',
    });
  });

  it('should return the correct default view model for Podman', () => {
    const result = getDefaultViewModel(false, true);
    expect(result).toEqual({
      networkMode: 'podman',
      hostname: '',
      domain: '',
      macAddress: '',
      ipv4Address: '',
      ipv6Address: '',
      primaryDns: '',
      secondaryDns: '',
      hostsFileEntries: [],
      container: '',
    });
  });

  it('should return the correct default view model for Linux Docker', () => {
    const result = getDefaultViewModel(false);
    expect(result).toEqual({
      networkMode: 'bridge',
      hostname: '',
      domain: '',
      macAddress: '',
      ipv4Address: '',
      ipv6Address: '',
      primaryDns: '',
      secondaryDns: '',
      hostsFileEntries: [],
      container: '',
    });
  });
});

describe('getNetworkMode', () => {
  const mockNetworks: Array<DockerNetwork> = [
    {
      Name: 'bridge',
      Id: 'bridge-id',
      Driver: 'bridge',
      Scope: 'local',
      Attachable: false,
      Internal: false,
      IPAM: { Config: [], Driver: '', Options: {} },
      Options: {},
      Containers: {},
    },
    {
      Name: 'host',
      Id: 'host-id',
      Driver: 'host',
      Scope: 'local',
      Attachable: false,
      Internal: false,
      IPAM: { Config: [], Driver: '', Options: {} },
      Options: {},
      Containers: {},
    },
    {
      Name: 'custom',
      Id: 'custom-id',
      Driver: 'bridge',
      Scope: 'local',
      Attachable: true,
      Internal: false,
      IPAM: { Config: [], Driver: '', Options: {} },
      Options: {},
      Containers: {},
    },
  ];

  const mockRunningContainers: Array<ContainerListViewModel> = [
    {
      Id: 'container-1',
      Names: ['container-1-name'],
    } as ContainerListViewModel, // gaslight the type to avoid over-specifying
  ];

  it('should return the network mode from HostConfig', () => {
    const config: ContainerDetailsJSON = {
      HostConfig: { NetworkMode: 'host' },
    };
    expect(getNetworkMode(config, mockNetworks)).toEqual(['host']);
  });

  it('should return the network mode from NetworkSettings if HostConfig is empty', () => {
    const config: ContainerDetailsJSON = {
      NetworkSettings: { Networks: { custom: {} } },
    };
    expect(getNetworkMode(config, mockNetworks)).toEqual(['custom']);
  });

  it('should return container mode when NetworkMode starts with "container:"', () => {
    const config: ContainerDetailsJSON = {
      HostConfig: { NetworkMode: 'container:container-1' },
    };
    expect(getNetworkMode(config, mockNetworks, mockRunningContainers)).toEqual(
      ['container', 'container-1-name']
    );
  });

  it('should return "podman" for bridge network when isPodman is true', () => {
    const config: ContainerDetailsJSON = {
      HostConfig: { NetworkMode: 'bridge' },
    };
    expect(getNetworkMode(config, mockNetworks, [], true)).toEqual(['podman']);
  });

  it('should return "bridge" for default network mode on Docker', () => {
    const config: ContainerDetailsJSON = {
      HostConfig: { NetworkMode: 'default' },
    };
    expect(getNetworkMode(config, mockNetworks)).toEqual(['bridge']);
  });

  it('should return the first available network if no matching network is found', () => {
    const config: ContainerDetailsJSON = {
      HostConfig: { NetworkMode: 'non-existent' },
    };
    expect(getNetworkMode(config, mockNetworks)).toEqual(['bridge']);
  });
});
