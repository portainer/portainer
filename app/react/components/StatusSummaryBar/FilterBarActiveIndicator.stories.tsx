import { useState } from 'react';
import { Meta } from '@storybook/react-webpack5';

import { FilterBarActiveIndicator } from './FilterBarActiveIndicator';

export default {
  component: FilterBarActiveIndicator,
  title: 'Design System/StatusSummaryBar/FilterBarActiveIndicator',
} as Meta;

export function Example() {
  const [activeFilter, setActiveFilter] = useState<string | null>('Running');

  if (!activeFilter) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--text-muted-color)]">
          Filter cleared. Pick one to bring the indicator back.
        </p>
        <div className="flex gap-2">
          {['Running', 'Stopped', 'Outdated'].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-md border border-solid border-gray-4 bg-transparent px-3 py-1 text-sm"
              onClick={() => setActiveFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <FilterBarActiveIndicator
      label={activeFilter}
      onClear={() => setActiveFilter(null)}
    />
  );
}

export function LongLabel() {
  return (
    <FilterBarActiveIndicator
      label="Outdated agents in production environments"
      onClear={() => {}}
    />
  );
}
