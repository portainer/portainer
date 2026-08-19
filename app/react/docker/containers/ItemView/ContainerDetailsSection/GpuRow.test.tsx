import { DeviceRequest } from 'docker-types/generated/1.44';

import { computeDockerGPUCommand } from './GpuRow';

describe('computeDockerGPUCommand', () => {
  it('should return "No GPU config found" when deviceRequests is empty', () => {
    const result = computeDockerGPUCommand([]);
    expect(result).toBe('No GPU config found');
  });

  it('should return "No GPU config found" when no GPU request is found', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'other',
        Count: 1,
        DeviceIDs: [],
        Capabilities: [],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('No GPU config found');
  });

  it('should return "all" with capabilities for nvidia driver with Count=-1', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'nvidia',
        Count: -1,
        DeviceIDs: [],
        Capabilities: [['gpu', 'utility']],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('all,"capabilities=gpu,utility"');
  });

  it('should return device IDs with capabilities when Count is not -1', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'nvidia',
        Count: 2,
        DeviceIDs: ['0', '1'],
        Capabilities: [['gpu', 'compute']],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('"device=0,1","capabilities=gpu,compute"');
  });

  it('should work with gpu capability detection instead of nvidia driver', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: '',
        Count: -1,
        DeviceIDs: [],
        Capabilities: [['gpu']],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('all,"capabilities=gpu"');
  });

  it('should return "all" without capabilities when Capabilities is undefined', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'nvidia',
        Count: -1,
        DeviceIDs: [],
        Capabilities: undefined,
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('all,');
  });

  it('should handle multiple device IDs correctly', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'nvidia',
        Count: 3,
        DeviceIDs: ['GPU-0', 'GPU-1', 'GPU-2'],
        Capabilities: [['gpu', 'utility', 'compute']],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe(
      '"device=GPU-0,GPU-1,GPU-2","capabilities=gpu,utility,compute"'
    );
  });

  it('should find GPU request when it is not the first element', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'other',
        Count: 1,
        DeviceIDs: [],
        Capabilities: [],
        Options: {},
      },
      {
        Driver: 'nvidia',
        Count: -1,
        DeviceIDs: [],
        Capabilities: [['gpu']],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('all,"capabilities=gpu"');
  });

  it('should handle empty capabilities array', () => {
    const deviceRequests: Array<DeviceRequest> = [
      {
        Driver: 'nvidia',
        Count: -1,
        DeviceIDs: [],
        Capabilities: [[]],
        Options: {},
      },
    ];
    const result = computeDockerGPUCommand(deviceRequests);
    expect(result).toBe('all,"capabilities="');
  });
});
