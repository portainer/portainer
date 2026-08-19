import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { GitBranch } from 'lucide-react';

import { Card } from './Card';

const meta = {
  title: 'Design System/Primitives/Card',
  component: Card.Container,
} as Meta<typeof Card.Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Card.Body>A basic card with body padding.</Card.Body>,
  },
};

export const WithShadow: Story = {
  args: {
    shadow: true,
    children: (
      <Card.Body>Card with a drop shadow to create visual elevation.</Card.Body>
    ),
  },
};

export const FilledVariant: Story = {
  args: {
    variant: 'filled',
    children: (
      <Card.Body>
        Filled card using the gray background variant for nested or secondary
        content areas.
      </Card.Body>
    ),
  },
};

export const WithHeader: Story = {
  render: (args) => (
    <Card.Container {...args}>
      <Card.Header title="Container registries" />
      <Card.Body>
        Manage connected registries and configure pull-through caching.
      </Card.Body>
    </Card.Container>
  ),
};

export const WithHeaderAndSubtitle: Story = {
  render: (args) => (
    <Card.Container {...args}>
      <Card.Header
        title="Container registries"
        subtitle="2 registries connected"
      />
      <Card.Body>
        Manage connected registries and configure pull-through caching.
      </Card.Body>
    </Card.Container>
  ),
};

export const WithHeaderIconAndActions: Story = {
  render: (args) => (
    <Card.Container {...args}>
      <Card.Header
        title="Git repositories"
        subtitle="3 repositories linked"
        actions={<button type="button">Add repository</button>}
        icon={GitBranch}
      />
      <Card.Body>
        Connect and manage Git repositories for GitOps deployments.
      </Card.Body>
    </Card.Container>
  ),
};

export const WithLongText: Story = {
  args: {
    className: 'max-w-xs',
    children: (
      <Card.Body>
        This card contains a very long piece of text to verify the component
        handles overflow gracefully. The container should clip or wrap content
        without breaking the surrounding layout.
      </Card.Body>
    ),
  },
};
