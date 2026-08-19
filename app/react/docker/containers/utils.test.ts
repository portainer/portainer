import { describe, it, expect } from 'vitest';

import { toListViewModel } from './utils';
import { DockerContainerResponse } from './types/response';

describe('toListViewModel', () => {
  function createMockResponse(
    overrides: Partial<DockerContainerResponse> = {}
  ): DockerContainerResponse {
    return {
      Id: 'container123',
      Names: ['/test-container'],
      Image: 'nginx:latest',
      ImageID: 'sha256:abc123',
      Command: 'nginx -g daemon off;',
      Created: 1234567890,
      State: 'running',
      Status: 'Up 2 hours',
      Ports: [],
      Labels: {},
      SizeRw: 0,
      SizeRootFs: 0,
      HostConfig: { NetworkMode: 'bridge' },
      NetworkSettings: { Networks: {} },
      Mounts: [],
      ...overrides,
    };
  }

  describe('Names field handling', () => {
    it('should remove leading slash from container names', () => {
      const response = createMockResponse({
        Names: ['/container1', '/container2'],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['container1', 'container2']);
    });

    it('should keep names without leading slash unchanged', () => {
      const response = createMockResponse({
        Names: ['container1', 'container2'],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['container1', 'container2']);
    });

    it('should handle mixed names with and without leading slashes', () => {
      const response = createMockResponse({
        Names: ['/container1', 'container2', '/container3'],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['container1', 'container2', 'container3']);
    });

    it('should handle empty string names', () => {
      const response = createMockResponse({
        Names: [''],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['']);
    });

    it('should handle names that are only a slash', () => {
      const response = createMockResponse({
        Names: ['/'],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['']);
    });

    it('should return default empty name when Names is undefined', () => {
      const response = createMockResponse({
        Names: undefined,
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['<empty_name>']);
    });

    it('should return default empty name when Names is empty array', () => {
      const response = createMockResponse({
        Names: [],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['<empty_name>']);
    });

    it('should handle names with multiple leading slashes', () => {
      const response = createMockResponse({
        Names: ['//container1', '///container2'],
      });

      const result = toListViewModel(response);

      // Note: The function only removes the first character if it's a slash
      expect(result.Names).toEqual(['/container1', '//container2']);
    });

    it('should handle names with slashes in the middle', () => {
      const response = createMockResponse({
        Names: ['/container/name', 'another/container'],
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['container/name', 'another/container']);
    });
  });

  describe('Full integration tests', () => {
    it('should transform complete response correctly', () => {
      const response = createMockResponse({
        Names: ['/my-container'],
        Status: 'Up 5 minutes',
        Labels: {
          'com.docker.compose.project': 'my-stack',
        },
        NetworkSettings: {
          Networks: {
            bridge: {
              IPAddress: '172.17.0.2',
              Gateway: '172.17.0.1',
            },
          },
        },
        Ports: [
          {
            IP: '0.0.0.0',
            PrivatePort: 80,
            PublicPort: 8080,
            Type: 'tcp',
          },
        ],
        Portainer: {
          ResourceControl: {
            Id: 1,
            ResourceId: 'container123',
            Type: 1,
            AdministratorsOnly: false,
            Public: false,
            System: false,
            TeamAccesses: [],
            UserAccesses: [],
          },
          Agent: {
            NodeName: 'node1',
          },
        },
      });

      const result = toListViewModel(response);

      expect(result.Names).toEqual(['my-container']);
      expect(result.IP).toBe('172.17.0.2');
      expect(result.StackName).toBe('my-stack');
      expect(result.NodeName).toBe('node1');
      expect(result.Ports).toHaveLength(1);
      expect(result.StatusText).toBe('Up 5 minutes');
    });
  });
});
