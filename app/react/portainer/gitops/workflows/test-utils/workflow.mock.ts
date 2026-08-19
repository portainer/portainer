import { Workflow } from '../types';

export const mockWorkflowHealthy: Workflow = {
  id: 1,
  name: 'healthy-workflow',
  status: {
    source: { status: 'healthy' },
    artifact: { status: 'healthy' },
    target: { status: 'healthy' },
  },
  artifacts: [
    {
      id: 101,
      type: 'stack',
      name: 'nginx-stack',
      platform: 'dockerStandalone',
      target: { endpointId: 5 },
      status: {
        source: { status: 'healthy' },
        artifact: { status: 'healthy' },
        target: { status: 'healthy' },
      },
      files: [
        { sourceId: 25, path: 'docker-compose.yml', ref: 'refs/heads/main' },
      ],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
  ],
};

export const mockWorkflowSourceError: Workflow = {
  id: 2,
  name: 'broken-source-stack',
  status: {
    source: {
      status: 'error',
      error: 'authentication failed: git clone error',
    },
    artifact: { status: 'unknown' },
    target: { status: 'unknown' },
  },
  artifacts: [
    {
      id: 102,
      type: 'stack',
      name: 'broken-source-stack',
      platform: 'dockerSwarm',
      target: { endpointId: 5 },
      status: {
        source: {
          status: 'error',
          error: 'authentication failed: git clone error',
        },
        artifact: { status: 'unknown' },
        target: { status: 'unknown' },
      },
      files: [
        { sourceId: 22, path: 'docker-compose.yml', ref: 'refs/heads/main' },
      ],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
  ],
};

export const mockWorkflowArtifactError: Workflow = {
  id: 3,
  name: 'invalid-compose-stack',
  status: {
    source: { status: 'healthy' },
    artifact: {
      status: 'error',
      error: 'invalid compose file: yaml: line 4: did not find expected key',
    },
    target: { status: 'unknown' },
  },
  artifacts: [
    {
      id: 103,
      type: 'stack',
      name: 'invalid-compose-stack',
      platform: 'kubernetes',
      target: { endpointId: 5, namespace: 'default' },
      status: {
        source: { status: 'healthy' },
        artifact: {
          status: 'error',
          error:
            'invalid compose file: yaml: line 4: did not find expected key',
        },
        target: { status: 'unknown' },
      },
      files: [{ sourceId: 25, path: 'manifest.yaml', ref: 'refs/heads/main' }],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
  ],
};

export const mockWorkflowTargetError: Workflow = {
  id: 4,
  name: 'unreachable-endpoint-stack',
  status: {
    source: { status: 'healthy' },
    artifact: { status: 'healthy' },
    target: {
      status: 'error',
      error: 'failed to deploy stack to endpoint: connection refused',
    },
  },
  artifacts: [
    {
      id: 104,
      type: 'stack',
      name: 'unreachable-endpoint-stack',
      platform: 'dockerStandalone',
      target: { endpointId: 6 },
      status: {
        source: { status: 'healthy' },
        artifact: { status: 'healthy' },
        target: {
          status: 'error',
          error: 'failed to deploy stack to endpoint: connection refused',
        },
      },
      files: [
        { sourceId: 22, path: 'docker-compose.yml', ref: 'refs/heads/main' },
      ],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
  ],
};

export const mockWorkflowEdgeMixed: Workflow = {
  id: 5,
  name: 'edge-stack',
  status: {
    source: { status: 'healthy' },
    artifact: { status: 'healthy' },
    target: {
      status: 'error',
      error: 'one or more edge groups failed to sync',
    },
  },
  artifacts: [
    {
      id: 105,
      type: 'edgeStack',
      name: 'edge-fleet-stack',
      platform: 'dockerStandalone',
      target: {
        edgeGroupIds: [10, 11],
        groupStatus: { 10: 'healthy', 11: 'error' },
        resolvedEndpointIds: [20, 21, 22],
      },
      status: {
        source: { status: 'healthy' },
        artifact: { status: 'healthy' },
        target: {
          status: 'error',
          error: 'one or more edge groups failed to sync',
        },
      },
      files: [
        { sourceId: 22, path: 'docker-compose.yml', ref: 'refs/heads/main' },
      ],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
  ],
};

export const mockWorkflowMultiArtifact: Workflow = {
  id: 6,
  name: 'multi-artifact-workflow',
  status: {
    source: { status: 'healthy' },
    artifact: { status: 'healthy' },
    target: { status: 'syncing' },
  },
  artifacts: [
    {
      id: 106,
      type: 'stack',
      name: 'multi-artifact-web',
      platform: 'dockerStandalone',
      target: { endpointId: 5 },
      status: {
        source: { status: 'healthy' },
        artifact: { status: 'healthy' },
        target: { status: 'healthy' },
      },
      files: [
        {
          sourceId: 12,
          path: 'web/docker-compose.yml',
          ref: 'refs/heads/main',
        },
      ],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
    {
      id: 107,
      type: 'stack',
      name: 'multi-artifact-worker',
      platform: 'dockerStandalone',
      target: { endpointId: 7 },
      status: {
        source: { status: 'healthy' },
        artifact: { status: 'syncing' },
        target: { status: 'syncing' },
      },
      files: [
        {
          sourceId: 12,
          path: 'worker/docker-compose.yml',
          ref: 'refs/heads/main',
        },
      ],
      creationDate: 1750000000,
      lastSyncDate: 1751000000,
    },
  ],
};

export const mockWorkflowEmpty: Workflow = {
  id: 7,
  name: 'empty-workflow',
  status: {
    source: { status: 'unknown' },
    artifact: { status: 'unknown' },
    target: { status: 'unknown' },
  },
  artifacts: [],
};

const mockWorkflows: Record<number, Workflow> = {
  1: mockWorkflowHealthy,
  2: mockWorkflowSourceError,
  3: mockWorkflowArtifactError,
  4: mockWorkflowTargetError,
  5: mockWorkflowEdgeMixed,
  6: mockWorkflowMultiArtifact,
  7: mockWorkflowEmpty,
};

export function getWorkflowMock(id: number): Workflow | undefined {
  return mockWorkflows[id];
}
