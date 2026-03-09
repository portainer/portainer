import _ from 'lodash';
import { QueryObserverResult } from '@tanstack/react-query';

import { Team } from '@/react/portainer/users/teams/types';
import { Role, User, UserId } from '@/portainer/users/types';
import {
  ContainerEngine,
  Environment,
} from '@/react/portainer/environments/types';
import { Stack, StackStatus, StackType } from '@/react/common/stacks/types';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';

export function createMockUser(overrides: Partial<User> = {}) {
  return {
    Id: 1,
    Username: 'user',
    RoleName: '',
    AuthenticationMethod: '',
    Checked: false,
    EndpointAuthorizations: {},
    PortainerAuthorizations: {},
    UseCache: false,
    ThemeSettings: {
      color: 'auto',
      subtleUpgradeButton: false,
      ...overrides.ThemeSettings,
    },
    ...overrides,
  } as User;
}

export function createMockUsers(
  count: number,
  roles: Role | Role[] | ((id: UserId) => Role)
): User[] {
  return _.range(1, count + 1).map((value) =>
    createMockUser({
      Id: value,
      Username: `user${value}`,
      Role: getRoles(roles, value),
    })
  );
}

function getRoles(
  roles: Role | Role[] | ((id: UserId) => Role),
  id: UserId
): Role {
  if (typeof roles === 'function') {
    return roles(id);
  }

  if (typeof roles === 'number') {
    return roles;
  }

  // Roles is an array
  if (roles.length === 0) {
    throw new Error('No roles provided');
  }

  // The number of roles is not necessarily the same length as the number of users
  // so we need to distribute the roles evenly and consistently
  return roles[(id - 1) % roles.length];
}

export function createMockTeams(count: number): Team[] {
  return _.range(1, count + 1).map((value) => ({
    Id: value,
    Name: `team${value}`,
  }));
}

export function createMockSubscriptions(count: number) {
  const subscriptions = _.range(1, count + 1).map((x) => ({
    id: `/subscriptions/subscription-${x}`,
    subscriptionId: `subscription-${x}`,
  }));

  return { value: subscriptions };
}

export function createMockResourceGroups(subscription: string, count: number) {
  const resourceGroups = _.range(1, count + 1).map((x) => ({
    id: `/subscriptions/${subscription}/resourceGroups/resourceGroup-${x}`,
    name: `resourcegroup-${x}`,
  }));

  return { value: resourceGroups };
}

export function createMockEnvironment(
  overrides: Partial<Environment> = {}
): Environment {
  return {
    TagIds: [],
    GroupId: 1,
    Type: 1,
    ContainerEngine: ContainerEngine.Docker,
    Name: 'environment',
    Status: 1,
    URL: 'url',
    Snapshots: [],
    Kubernetes: {
      Flags: {
        IsServerMetricsDetected: true,
        IsServerIngressClassDetected: true,
        IsServerStorageDetected: true,
      },
      Snapshots: [],
      Configuration: {
        IngressClasses: [],
        IngressAvailabilityPerNamespace: false,
        AllowNoneIngressClass: false,
      },
    },
    UserAccessPolicies: {},
    TeamAccessPolicies: {},
    ComposeSyntaxMaxVersion: '0',
    EdgeKey: '',
    EnableGPUManagement: false,
    Id: 3,
    UserTrusted: false,
    Edge: {
      AsyncMode: false,
      PingInterval: 0,
      CommandInterval: 0,
      SnapshotInterval: 0,
    },
    SecuritySettings: {
      allowBindMountsForRegularUsers: false,
      allowPrivilegedModeForRegularUsers: false,
      allowContainerCapabilitiesForRegularUsers: false,
      allowDeviceMappingForRegularUsers: false,
      allowHostNamespaceForRegularUsers: false,
      allowStackManagementForRegularUsers: false,
      allowSysctlSettingForRegularUsers: false,
      allowSecurityOptForRegularUsers: false,
      allowVolumeBrowserForRegularUsers: false,
      enableHostManagementFeatures: false,
    },
    DeploymentOptions: {
      overrideGlobalOptions: false,
      hideAddWithForm: true,
      hideWebEditor: false,
      hideFileUpload: false,
    },
    Gpus: [],
    Agent: { Version: '1.0.0' },
    EnableImageNotification: false,
    ChangeWindow: {
      Enabled: false,
      EndTime: '',
      StartTime: '',
    },
    StatusMessage: {
      detail: '',
      summary: '',
    },
    ...overrides,
  };
}

export function createMockQueryResult<TData, TError = unknown>(
  data: TData,
  overrides?: Partial<QueryObserverResult<TData, TError>>
) {
  const defaultResult = {
    data,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    errorUpdateCount: 0,
    failureReason: null,
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    refetch: async () => defaultResult,
    remove: () => {},
    status: 'success',
    fetchStatus: 'idle',
  };

  return { ...defaultResult, ...overrides };
}

export function createMockStack(overrides?: Partial<Stack>): Stack {
  return {
    Id: 1,
    Name: 'test-stack',
    Type: StackType.DockerCompose,
    EndpointId: 1,
    SwarmId: '',
    EntryPoint: 'docker-compose.yml',
    Env: [],
    Status: StackStatus.Active,
    ProjectPath: '/data/compose/1',
    CreationDate: Date.now(),
    CreatedBy: 'admin',
    UpdateDate: Date.now(),
    UpdatedBy: 'admin',
    FromAppTemplate: false,
    IsComposeFormat: true,
    SupportRelativePath: false,
    FilesystemPath: '/data/compose/1',
    StackFileVersion: 1,
    PreviousDeploymentInfo: undefined,
    ...overrides,
  };
}

export function createMockContainer(
  overrides?: Partial<ContainerDetailsViewModel>
): ContainerDetailsViewModel {
  return _.merge(
    {
      Id: 'container-id-123',
      Image: 'sha256:abcd1234',
      State: {
        Status: 'running',
        Running: true,
        Paused: false,
        Restarting: false,
        OOMKilled: false,
        Dead: false,
        Pid: 1234,
        ExitCode: 0,
        Error: '',
        StartedAt: '2024-01-01T00:00:00Z',
        FinishedAt: '0001-01-01T00:00:00Z',
        Health: undefined,
      },
      Created: '2024-01-01T00:00:00Z',
      Name: '/test-container',
      NetworkSettings: {
        Ports: {
          '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '8080' }],
        },
      },
      Args: [],
      Config: {
        Image: 'nginx:latest',
        Cmd: ['nginx', '-g', 'daemon off;'],
        Entrypoint: [],
        Env: ['PATH=/usr/local/bin', 'NODE_ENV=production'],
        Labels: { 'com.example.label': 'value' },
      },
      HostConfig: {
        RestartPolicy: { Name: 'always', MaximumRetryCount: 0 },
        Sysctls: { 'net.ipv4.ip_forward': '1' },
        DeviceRequests: [],
      },
      Mounts: [],
      Model: {} as ContainerDetailsViewModel['Model'],
    },
    overrides
  ) as ContainerDetailsViewModel;
}
