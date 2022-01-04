import { Story } from '@storybook/react';

import {
  Environment,
  EnvironmentStatus,
  EnvironmentType,
} from '@/portainer/environments/types';

import { EnvironmentItem } from './EnvironmentItem';

export default {
  component: EnvironmentItem,
  title: 'Home/EnvironmentList/EnvironmentItem',
};

interface Args {
  environment: Environment;
  isAdmin: boolean;
  homepageLoadTime: number;
}

function Template({ environment, isAdmin, homepageLoadTime = 1 }: Args) {
  return (
    <EnvironmentItem
      environment={environment}
      homepageLoadTime={homepageLoadTime}
      isAdmin={isAdmin}
      onClick={() => {}}
    />
  );
}

export const DockerEnvironment: Story<Args> = Template.bind({});
DockerEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.Docker),
};

export const DockerAgentEnvironment: Story<Args> = Template.bind({});
DockerAgentEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.AgentOnDocker),
};

export const DockerEdgeEnvironment: Story<Args> = Template.bind({});
DockerEdgeEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.EdgeAgentOnDocker),
};

export const AzureEnvironment: Story<Args> = Template.bind({});
AzureEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.Azure),
};

export const KubernetesLocalEnvironment: Story<Args> = Template.bind({});
KubernetesLocalEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.KubernetesLocal),
};

export const KubernetesAgentEnvironment: Story<Args> = Template.bind({});
KubernetesAgentEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.AgentOnKubernetes),
};

export const KubernetesEdgeEnvironment: Story<Args> = Template.bind({});
KubernetesEdgeEnvironment.args = {
  environment: mockEnvironment(EnvironmentType.EdgeAgentOnKubernetes),
};

function mockEnvironment(type: EnvironmentType): Environment {
  return {
    Id: 1,
    Name: 'docker environment',
    GroupId: 1,
    GroupName: 'group1',
    Snapshots: [],
    Status: EnvironmentStatus.Up,
    TagIds: [],
    Type: type,
    Kubernetes: {
      Snapshots: [],
    },
    URL: 'url',
  };
}
