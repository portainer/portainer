import { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  LayoutGrid,
  Shield,
  Database,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import KubernetesLogo from '@/assets/ico/vendor/kubernetes.svg';
import DockerLogo from '@/assets/ico/vendor/docker.svg';
import PodmanLogo from '@/assets/ico/vendor/podman.svg';

import { ResourceDetailHeaderSkeleton } from './ResourceDetailHeaderSkeleton';
import { ResourceDetailHeader } from './ResourceDetailHeader';
import { ActionBarButton } from './ActionBarButton';
import { ActionBarShell } from './ActionBarShell';
import { HeaderStats } from './HeaderStats';
import { ResourceStatBlock } from './ResourceStatBlock';

// Mirrors the env-group platform breakdown used by GroupHeader on
// feat/R8S-813. Vertical stack of engine-icon + count + name rows so
// mixed-platform groups stay scannable in the right column.
const platformBreakdown = (
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
);

const meta: Meta<typeof ResourceDetailHeader> = {
  title: 'Design System/ResourceDetailHeader',
  component: ResourceDetailHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResourceDetailHeader>;

/**
 * Demonstrates the optional `actionBar` slot.
 *
 * Wrap content in `<ActionBarShell>` to get the standard bottom-segment
 * styling (rounded bottom, border, tint). Children inside the shell
 * naturally split left/right because `ActionBarShell` is `justify-between`.
 * Pass a custom element to `actionBar` directly if you need a different
 * layout.
 */
export const ActionBar: Story = {
  args: {
    title: 'Production Cluster',
    icon: (
      <LayoutGrid className="!text-group-accent-8 th-dark:!text-group-accent-2" />
    ),
    subtitleLabel: 'Environment Group',
    description: 'Resource detail header with the action bar slot in use',
  },
  render: (args) => (
    <ResourceDetailHeader
      {...args}
      actionBar={
        <ActionBarShell>
          <div className="flex items-center gap-2">
            <ActionBarButton
              icon={Plus}
              onClick={() => {}}
              data-cy="action-bar-add-environments"
            >
              Add Environments
            </ActionBarButton>
            <ActionBarButton
              icon={RefreshCw}
              onClick={() => {}}
              data-cy="action-bar-sync"
            >
              Sync
            </ActionBarButton>
          </div>
          <div className="flex items-center gap-2">
            <ActionBarButton
              icon={Trash2}
              onClick={() => {}}
              data-cy="action-bar-delete"
            >
              Delete
            </ActionBarButton>
          </div>
        </ActionBarShell>
      }
    />
  ),
};

/**
 * Demonstrates the optional `rightInfo` slot with `HeaderStats` and
 * `ResourceStatBlock` — the standard pattern for showing health/status cards
 * on the right of the header.
 */
export const StatBlocks: Story = {
  args: {
    title: 'orders-api',
    icon: (
      <LayoutGrid className="!text-group-accent-8 th-dark:!text-group-accent-2" />
    ),
    subtitleLabel: 'GitOps Source',
    description: 'Synced from origin/main · 14 services',
    rightInfo: (
      <HeaderStats>
        <ResourceStatBlock status="success">
          <ResourceStatBlock.Label>Sync Status</ResourceStatBlock.Label>
          <ResourceStatBlock.Value dot>Synced</ResourceStatBlock.Value>
          <ResourceStatBlock.Meta>
            Last reconciled 2 min ago
          </ResourceStatBlock.Meta>
        </ResourceStatBlock>
        <ResourceStatBlock status="success">
          <ResourceStatBlock.Label>Health</ResourceStatBlock.Label>
          <ResourceStatBlock.Value suffix="healthy">
            3/3
          </ResourceStatBlock.Value>
        </ResourceStatBlock>
      </HeaderStats>
    ),
  },
};

/**
 * The full env-group detail-header pattern, mirroring how GroupHeader uses
 * `ResourceDetailHeader` in the environment-group ItemView: a vertical
 * platform breakdown stat block, a centred policies count stat block, and
 * a borderless Refresh / Add environments / Delete action bar.
 */
export const WithStatBlocksAndActionBar: Story = {
  args: {
    title: 'Production Cluster',
    icon: (
      <LayoutGrid className="!text-group-accent-8 th-dark:!text-group-accent-2" />
    ),
    subtitleLabel: 'Environment Group',
    description: 'Main production environment group',
  },
  render: (args) => (
    <ResourceDetailHeader
      {...args}
      rightInfo={
        <HeaderStats>
          <ResourceStatBlock>
            <ResourceStatBlock.Label>Environments</ResourceStatBlock.Label>
            <ResourceStatBlock.Value>
              {platformBreakdown}
            </ResourceStatBlock.Value>
          </ResourceStatBlock>
          <ResourceStatBlock>
            <ResourceStatBlock.Label icon={<Shield className="h-3 w-3" />}>
              Policies
            </ResourceStatBlock.Label>
            <ResourceStatBlock.Value align="center" size="lg">
              3
            </ResourceStatBlock.Value>
          </ResourceStatBlock>
        </HeaderStats>
      }
      actionBar={
        <ActionBarShell>
          <div className="flex items-center gap-3">
            <ActionBarButton
              icon={RefreshCw}
              onClick={() => {}}
              data-cy="combined-example-refresh"
            >
              Refresh
            </ActionBarButton>
            <ActionBarButton
              icon={Plus}
              onClick={() => {}}
              data-cy="combined-example-add"
            >
              Add environments
            </ActionBarButton>
          </div>
          <div className="flex items-center gap-1">
            <ActionBarButton
              icon={Trash2}
              onClick={() => {}}
              data-cy="combined-example-delete"
            >
              Delete
            </ActionBarButton>
          </div>
        </ActionBarShell>
      }
    />
  ),
};

export const Default: Story = {
  args: {
    title: 'Production Cluster',
    icon: <LayoutGrid className="text-blue-9 th-dark:text-blue-3" />,
    subtitleLabel: 'Environment Group',
    description: 'Main production environment group',
  },
};

export const WithBadge: Story = {
  args: {
    ...Default.args,
    badge: (
      <span className="inline-block rounded-full bg-blue-1 px-2 py-1 text-xs font-medium text-blue-9 th-dark:bg-blue-11 th-dark:text-blue-2">
        Multi-platform
      </span>
    ),
  },
};

export const MinimalUsage: Story = {
  args: {
    title: 'Simple Group',
    icon: <LayoutGrid className="text-blue-8" />,
  },
};

export const LoadingState: Story = {
  render: () => (
    <ResourceDetailHeaderSkeleton statBlockCount={2} hasActionBar />
  ),
};

export const LoadingStateNoActionBar: Story = {
  render: () => (
    <ResourceDetailHeaderSkeleton statBlockCount={1} hasActionBar={false} />
  ),
};

export const CustomIconBackground: Story = {
  args: {
    ...Default.args,
    icon: <Database className="text-warning-8 th-dark:text-warning-2" />,
    iconBackgroundClassName: 'bg-warning-3 th-dark:bg-warning-10',
  },
};

export const WithoutDescription: Story = {
  args: {
    ...Default.args,
    description: undefined,
  },
};

export const WithoutStats: Story = {
  args: {
    ...Default.args,
    rightInfo: undefined,
  },
};

export const LongTitle: Story = {
  args: {
    ...Default.args,
    title:
      'Very Long Environment Group Name That Might Wrap to Multiple Lines in Some Contexts',
    description:
      'This group contains multiple types of container engines including Docker, Kubernetes, and Podman installations',
  },
};

export const DevelopmentGroup: Story = {
  args: {
    title: 'Development Environments',
    icon: <LayoutGrid className="text-success-8 th-dark:text-success-2" />,
    iconBackgroundClassName: 'bg-success-3 th-dark:bg-success-10',
    subtitleLabel: 'Environment Group',
    description: 'Development and testing environments for team collaboration',
    badge: (
      <span className="inline-block rounded-full bg-success-1 px-2 py-1 text-xs font-medium text-success-9 th-dark:bg-success-11 th-dark:text-success-2">
        Dev
      </span>
    ),
  },
};

export const StagingGroup: Story = {
  args: {
    title: 'Staging Environment',
    icon: <LayoutGrid className="text-orange-8 th-dark:text-orange-2" />,
    iconBackgroundClassName: 'bg-orange-3 th-dark:bg-orange-10',
    subtitleLabel: 'Environment Group',
    description: 'Staging and pre-production validation environment',
    badge: (
      <span className="inline-block rounded-full bg-orange-1 px-2 py-1 text-xs font-medium text-orange-9 th-dark:bg-orange-11 th-dark:text-orange-2">
        Staging
      </span>
    ),
  },
};

export const PolicyExample: Story = {
  args: {
    title: 'Security Policy',
    icon: <Shield className="h-6 w-6 text-blue-9 th-dark:text-blue-3" />,
    iconBackgroundClassName: 'bg-blue-3 th-dark:bg-blue-9',
    subtitleLabel: 'Policy',
    subtitleClassName: 'text-blue-10 th-dark:text-blue-8',
    badge: (
      <span className="inline-block rounded bg-blue-2 px-2 py-1 text-xs font-medium text-blue-9 th-dark:bg-blue-11 th-dark:text-blue-2">
        Docker
      </span>
    ),
    rightInfo: (
      <div className="text-muted text-sm">
        <b>12</b> environments targeted
      </div>
    ),
  },
};

export const CustomSubtitleColor: Story = {
  args: {
    title: 'Custom Entity',
    icon: <AlertCircle className="text-purple-8" />,
    iconBackgroundClassName: 'bg-purple-3 th-dark:bg-purple-9',
    subtitleLabel: 'Custom Type',
    subtitleClassName: 'text-purple-10 th-dark:text-purple-8',
    description:
      'Demonstrates custom subtitle color for different entity types',
  },
};

export const EnvironmentGroup: Story = {
  args: {
    title: 'Production Cluster',
    icon: (
      <LayoutGrid className="!text-group-accent-8 th-dark:!text-group-accent-2" />
    ),
    subtitleLabel: 'Environment Group',
    description: 'Main production environment group',
  },
  render: (args) => (
    <ResourceDetailHeader
      {...args}
      actionBar={
        <ActionBarShell>
          <div className="flex items-center gap-2">
            <ActionBarButton
              icon={Plus}
              onClick={() => {}}
              data-cy="add-environments-button"
            >
              Add Environments
            </ActionBarButton>
          </div>
          <div className="flex items-center gap-2">
            <ActionBarButton
              icon={Trash2}
              onClick={() => {}}
              data-cy="delete-environment-group-button"
            >
              Delete
            </ActionBarButton>
          </div>
        </ActionBarShell>
      }
    />
  ),
};
