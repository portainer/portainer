import { useState } from 'react';
import { Meta } from '@storybook/react-webpack5';

import { FilterBarButton, Color } from './FilterBarButton';

export default {
  component: FilterBarButton,
  title: 'Design System/StatusSummaryBar/FilterBarButton',
} as Meta;

export function Example() {
  const [selected, setSelected] = useState('');

  const buttons: Array<{
    label: string;
    count: number;
    color?: Color;
  }> = [
    { label: 'Total', count: 18 },
    { label: 'Running', count: 12, color: 'success' },
    { label: 'Stopped', count: 4, color: 'error' },
    { label: 'Outdated', count: 2, color: 'warning' },
    { label: 'Hidden', count: 0, color: 'gray' },
  ];

  return (
    <div className="flex items-center gap-1">
      {buttons.map((btn) => (
        <FilterBarButton
          key={btn.label}
          name="status-filter"
          label={btn.label}
          count={btn.count}
          color={btn.color}
          isSelected={selected === btn.label}
          onClick={() =>
            setSelected((prev) => (prev === btn.label ? '' : btn.label))
          }
          data-cy={`filter-${btn.label.toLowerCase()}`}
        />
      ))}
    </div>
  );
}
