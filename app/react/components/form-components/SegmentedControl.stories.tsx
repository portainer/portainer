import { Meta, StoryFn } from '@storybook/react-webpack5';
import { useState } from 'react';

import { SegmentedControl } from './SegmentedControl';
import type {
  SegmentedControlVariant,
  SegmentedControlSize,
} from './SegmentedControl';

export default {
  component: SegmentedControl,
  title: 'Components/Forms/SegmentedControl',
} as Meta;

const items = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'stopped', label: 'Stopped' },
  { id: 'disabled-item', label: 'Disabled', disabled: true },
];

function Controlled({
  variant,
  size,
}: {
  variant?: SegmentedControlVariant;
  size?: SegmentedControlSize;
}) {
  const [active, setActive] = useState('all');
  return (
    <SegmentedControl
      items={items}
      activeId={active}
      onChange={setActive}
      label="Filter"
      variant={variant}
      size={size}
    />
  );
}

export const ContainedMd: StoryFn = () => (
  <Controlled variant="contained" size="md" />
);
export const ContainedSm: StoryFn = () => (
  <Controlled variant="contained" size="sm" />
);
export const PillMd: StoryFn = () => <Controlled variant="pill" size="md" />;
export const PillSm: StoryFn = () => <Controlled variant="pill" size="sm" />;
