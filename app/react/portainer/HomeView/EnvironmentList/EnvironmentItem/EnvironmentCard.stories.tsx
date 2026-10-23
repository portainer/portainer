import { StoryFn } from '@storybook/react-webpack5';

import {
  Environment,
  EnvironmentStatus,
  EnvironmentType,
  KubernetesSnapshot,
} from '@/react/portainer/environments/types';
import { DockerSnapshot } from '@/react/docker/snapshots/types';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { EnvironmentCard } from './EnvironmentCard';

const WrappedEnvironmentCard = withUserProvider(EnvironmentCard);

export default {
  component: WrappedEnvironmentCard,
  title: 'Components/Home/EnvironmentList/EnvironmentCard',
};

interface Args {
  environment: Environment;
  groupName?: string;
}

function Template({ environment, groupName }: Args) {
  return (
    <WrappedEnvironmentCard
      environment={environment}
      groupName={groupName}
      onClickBrowse={() => {}}
    />
  );
}

// Docker
export const DockerEnvironment: StoryFn<Args> = Template.bind({});
DockerEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.Docker),
};

export const DockerAgentEnvironment: StoryFn<Args> = Template.bind({});
DockerAgentEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.AgentOnDocker),
};

export const DockerEdgeEnvironment: StoryFn<Args> = Template.bind({});
DockerEdgeEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.EdgeAgentOnDocker),
};

export const DockerEnvironmentDown: StoryFn<Args> = Template.bind({});
DockerEnvironmentDown.args = {
  environment: mockEnvironment(EnvironmentType.Docker, EnvironmentStatus.Down),
};

// Azure
export const AzureEnvironment: StoryFn<Args> = Template.bind({});
AzureEnvironment.args = { environment: mockEnvironment(EnvironmentType.Azure) };

// Kubernetes
export const KubernetesAgentEnvironment: StoryFn<Args> = Template.bind({});
KubernetesAgentEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.AgentOnKubernetes),
};

export const KubernetesEdgeEnvironment: StoryFn<Args> = Template.bind({});
KubernetesEdgeEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.EdgeAgentOnKubernetes),
};

export const KubernetesEnvironmentDown: StoryFn<Args> = Template.bind({});
KubernetesEnvironmentDown.args = {
  environment: mockEnvironment(
    EnvironmentType.KubernetesLocal,
    EnvironmentStatus.Down
  ),
};

// Long name wrapping
export const LongEnvironmentName: StoryFn<Args> = Template.bind({});
LongEnvironmentName.args = {
  environment: mockEnvironment(
    EnvironmentType.AgentOnKubernetes,
    EnvironmentStatus.Up,
    {
      Name: 'production-eu-west-1-kubernetes-cluster-primary-workload-node-pool',
    }
  ),
  groupName: 'Production Europe',
};

export const LongEnvironmentNameWithStats: StoryFn<Args> = Template.bind({});
LongEnvironmentNameWithStats.args = {
  environment: mockKubernetesEnvironmentWithStats({
    Name: 'production-eu-west-1-kubernetes-cluster-primary-workload-node-pool',
  }),
  groupName: 'Production Europe',
};

// With group name
export const WithGroupName: StoryFn<Args> = Template.bind({});
WithGroupName.args = {
  environment: mockEnvironment(EnvironmentType.AgentOnKubernetes),
  groupName: 'Production',
};

// With stats
export const DockerWithStats: StoryFn<Args> = Template.bind({});
DockerWithStats.args = { environment: mockDockerEnvironmentWithStats() };

export const KubernetesWithStats: StoryFn<Args> = Template.bind({});
KubernetesWithStats.args = {
  environment: mockKubernetesEnvironmentWithStats(),
};

function mockEnvironment(
  type: EnvironmentType,
  status: EnvironmentStatus = EnvironmentStatus.Up,
  overrides: Partial<Environment> = {}
): Environment {
  const env = createMockEnvironment();
  env.Type = type;
  env.Status = status;
  return { ...env, ...overrides };
}

function mockDockerEnvironmentWithStats(): Environment {
  const env = createMockEnvironment();
  env.Type = EnvironmentType.Docker;
  env.Status = EnvironmentStatus.Up;
  env.Snapshots = [mockDockerSnapshot()];
  return env;
}

function mockKubernetesEnvironmentWithStats(
  overrides: Partial<Environment> = {}
): Environment {
  const env = createMockEnvironment();
  env.Type = EnvironmentType.KubernetesLocal;
  env.Status = EnvironmentStatus.Up;
  env.Kubernetes.Snapshots = [mockKubernetesSnapshot()];
  return { ...env, ...overrides };
}

function mockDockerSnapshot(): DockerSnapshot {
  return {
    TotalCPU: 4,
    TotalMemory: 8 * 1024 * 1024 * 1024,
    NodeCount: 1,
    ImageCount: 12,
    VolumeCount: 3,
    ContainerCount: 5,
    RunningContainerCount: 3,
    StoppedContainerCount: 2,
    HealthyContainerCount: 2,
    UnhealthyContainerCount: 1,
    Time: 1716825600,
    StackCount: 2,
    ServiceCount: 0,
    Swarm: false,
    DockerVersion: '24.0.7',
    GpuUseAll: false,
    GpuUseList: [],
    IsPodman: false,
  };
}

function mockKubernetesSnapshot(): KubernetesSnapshot {
  return {
    KubernetesVersion: 'v1.31.0',
    TotalCPU: 12,
    TotalMemory: 32 * 1024 * 1024 * 1024,
    Time: 1716825600,
    NodeCount: 3,
  };
}
