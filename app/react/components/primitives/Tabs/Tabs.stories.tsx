import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { userEvent, within, expect } from 'storybook/test';
import { useState } from 'react';

import { Tabs } from './Tabs';
import { TabSize, TabVariant } from './TabsItem';

const labels = ['Services', 'Compose', 'Automation', 'Disabled'] as const;

function Example({ size, variant }: { variant: TabVariant; size: TabSize }) {
  const [active, setActive] = useState('Services');
  return (
    <Tabs.Container variant={variant} size={size}>
      {labels.map((label, i) => (
        <Tabs.Item
          key={label}
          isActive={active === label}
          disabled={i === labels.length - 1}
          aria-current={active === label ? 'page' : undefined}
          onClick={() => setActive(label)}
        >
          {label}
        </Tabs.Item>
      ))}
    </Tabs.Container>
  );
}

const meta = {
  title: 'Design System/Primitives/Tabs',
  component: Example,
  parameters: { layout: 'padded' },
  args: {
    variant: 'contained',
    size: 'md',
  },
} as Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const composeTab = canvas.getByRole('button', { name: 'Compose' });
    await userEvent.click(composeTab);
    expect(composeTab).toHaveAttribute('aria-current', 'page');
  },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Pill: Story = {
  args: { variant: 'pill' },
};

export const PillSmall: Story = {
  args: { variant: 'pill', size: 'sm' },
};
