import { Meta, StoryObj } from '@storybook/react-webpack5';

import KubernetesLogo from '@/assets/ico/vendor/kubernetes.svg';
import DockerLogo from '@/assets/ico/vendor/docker.svg';
import PodmanLogo from '@/assets/ico/vendor/podman.svg';

import { ResourceStatBlock } from './ResourceStatBlock';

const meta: Meta<typeof ResourceStatBlock> = {
  title: 'Design System/ResourceDetailHeader/ResourceStatBlock',
  component: ResourceStatBlock,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-fit">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResourceStatBlock>;

export const Default: Story = {
  render: () => (
    <ResourceStatBlock>
      <ResourceStatBlock.Label>Health</ResourceStatBlock.Label>
      <ResourceStatBlock.Value>Healthy</ResourceStatBlock.Value>
    </ResourceStatBlock>
  ),
};

export const SuccessWithDot: Story = {
  render: () => (
    <ResourceStatBlock status="success">
      <ResourceStatBlock.Label>Sync Status</ResourceStatBlock.Label>
      <ResourceStatBlock.Value dot>Synced</ResourceStatBlock.Value>
      <ResourceStatBlock.Meta>Last reconciled 2 min ago</ResourceStatBlock.Meta>
    </ResourceStatBlock>
  ),
};

export const ValueWithSuffix: Story = {
  render: () => (
    <ResourceStatBlock status="success">
      <ResourceStatBlock.Label>Health</ResourceStatBlock.Label>
      <ResourceStatBlock.Value suffix="healthy">3/3</ResourceStatBlock.Value>
    </ResourceStatBlock>
  ),
};

export const Danger: Story = {
  render: () => (
    <ResourceStatBlock status="danger">
      <ResourceStatBlock.Label>Sync Status</ResourceStatBlock.Label>
      <ResourceStatBlock.Value dot>Out of sync</ResourceStatBlock.Value>
      <ResourceStatBlock.Meta>
        Drift detected on origin/main
      </ResourceStatBlock.Meta>
    </ResourceStatBlock>
  ),
};

export const Warning: Story = {
  render: () => (
    <ResourceStatBlock status="warning">
      <ResourceStatBlock.Label>Reconciler</ResourceStatBlock.Label>
      <ResourceStatBlock.Value dot>Degraded</ResourceStatBlock.Value>
      <ResourceStatBlock.Meta>Last attempt failed</ResourceStatBlock.Meta>
    </ResourceStatBlock>
  ),
};

export const Pending: Story = {
  render: () => (
    <ResourceStatBlock status="pending">
      <ResourceStatBlock.Label>Sync Status</ResourceStatBlock.Label>
      <ResourceStatBlock.Value dot>Syncing</ResourceStatBlock.Value>
      <ResourceStatBlock.Meta>Applying changes…</ResourceStatBlock.Meta>
    </ResourceStatBlock>
  ),
};

/**
 * When an environment group only contains one engine type, surface that
 * engine's icon next to the count for instant recognition.
 */
export const SingleEnvironmentType: Story = {
  render: () => (
    <ResourceStatBlock>
      <ResourceStatBlock.Label>Environments</ResourceStatBlock.Label>
      <ResourceStatBlock.Value>
        <span className="flex items-center gap-2 text-xs font-normal">
          <img src={KubernetesLogo} alt="" className="h-4 w-4" />
          <span>
            <b className="font-bold">3</b> Kubernetes
          </span>
        </span>
      </ResourceStatBlock.Value>
    </ResourceStatBlock>
  ),
};

/**
 * For mixed-platform groups the breakdown stacks vertically with each
 * engine's icon aligned to the left margin of the row.
 */
export const MixedEnvironmentTypes: Story = {
  render: () => (
    <ResourceStatBlock>
      <ResourceStatBlock.Label>Environments</ResourceStatBlock.Label>
      <ResourceStatBlock.Value>
        <span className="flex flex-col gap-1.5 text-xs font-normal">
          <span className="flex items-center gap-2">
            <img src={KubernetesLogo} alt="" className="h-4 w-4" />
            <span>
              <b className="font-bold">3</b> Kubernetes
            </span>
          </span>
          <span className="flex items-center gap-2">
            <img src={DockerLogo} alt="" className="h-4 w-4" />
            <span>
              <b className="font-bold">1</b> Docker
            </span>
          </span>
          <span className="flex items-center gap-2">
            <img src={PodmanLogo} alt="" className="h-4 w-4" />
            <span>
              <b className="font-bold">1</b> Podman
            </span>
          </span>
        </span>
      </ResourceStatBlock.Value>
    </ResourceStatBlock>
  ),
};
