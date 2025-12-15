import { describe, it, expect } from 'vitest';

import { CreateContainerRequest } from '../types';

import { toRequest } from './toRequest';
import { Values } from './types';

describe('toRequest', () => {
  const mockOldConfig: CreateContainerRequest = {
    Hostname: 'old-hostname',
    Domainname: 'old-domain',
    MacAddress: '02:42:ac:11:00:99',
    HostConfig: {
      NetworkMode: 'bridge',
      Dns: ['1.1.1.1'],
      ExtraHosts: [],
    },
    NetworkingConfig: {
      EndpointsConfig: {
        bridge: {
          Aliases: [],
        },
      },
    },
  };

  const mockValues: Values = {
    networkMode: 'bridge',
    hostname: 'new-hostname',
    domain: 'new-domain',
    macAddress: '02:42:ac:11:00:88',
    ipv4Address: '172.17.0.5',
    ipv6Address: 'fe80::42:acff:fe11:5',
    primaryDns: '8.8.8.8',
    secondaryDns: '8.8.4.4',
    hostsFileEntries: ['host1:127.0.0.1'],
    container: '',
  };

  it('should use MAC address from values, not from oldConfig', () => {
    const oldMacAddress = '02:42:ac:11:00:99';
    const macAddress = '02:42:ac:11:00:88';
    const result = toRequest(
      { ...mockOldConfig, MacAddress: oldMacAddress },
      { ...mockValues, macAddress },
      'container-123'
    );

    expect(result.MacAddress).toBe(macAddress);
    expect(result.MacAddress).not.toBe(oldMacAddress);
  });

  it('should allow empty MAC address when duplicating containers', () => {
    const valuesWithEmptyMac: Values = {
      ...mockValues,
      macAddress: '', // Empty MAC from toViewModel
    };

    const result = toRequest(
      mockOldConfig,
      valuesWithEmptyMac,
      'container-123'
    );

    expect(result.MacAddress).toBe('');
    expect(result.MacAddress).not.toBe(mockOldConfig.MacAddress);
  });

  it('should set other network properties from values', () => {
    const result = toRequest(mockOldConfig, mockValues, 'container-123');

    expect(result.Hostname).toBe('new-hostname');
    expect(result.Domainname).toBe('new-domain');
    expect(result.HostConfig.NetworkMode).toBe('bridge');
    expect(result.HostConfig.Dns).toEqual(['8.8.8.8', '8.8.4.4']);
    expect(result.HostConfig.ExtraHosts).toEqual(['host1:127.0.0.1']);
    expect(result.NetworkingConfig.EndpointsConfig?.bridge.IPAMConfig).toEqual({
      IPv4Address: '172.17.0.5',
      IPv6Address: 'fe80::42:acff:fe11:5',
    });
  });
});
