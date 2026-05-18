import { FilterBarButton, Color } from './FilterBarButton';
import { FilterBarActiveIndicator } from './FilterBarActiveIndicator';

export interface StatusSegment<TValue = string> {
  key: TValue;
  label: string;
  count: number;
  color: Color;
}

interface Props<TValue> {
  total: number;
  segments: Array<StatusSegment<TValue>>;
  value: TValue | null;
  onChange: (filter: TValue | null) => void;
  radioGroupName?: string;
  ariaLabel?: string;
  isLoading?: boolean;
  'data-cy'?: string;
}

export function StatusSummaryBar<TValue extends string = string>({
  total,
  segments,
  value,
  onChange,
  radioGroupName = 'status-summary-filter',
  ariaLabel = 'Filter by status',
  isLoading = false,
  'data-cy': dataCy = 'status-summary-bar',
}: Props<TValue>) {
  const isAllSelected = !value || value === 'all' || value === 'custom';
  const activeLabel = segments.find((s) => s.key === value)?.label;

  function handleSegmentClick(key: TValue) {
    onChange(value === key ? null : key);
  }

  return (
    <div
      className="relative flex items-stretch overflow-x-auto overflow-y-hidden rounded-lg border border-solid border-[var(--border-widget)] bg-[var(--bg-widget-color)]"
      data-cy={dataCy}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      <FilterBarButton
        count={total}
        label="Total"
        isSelected={isAllSelected}
        onClick={() => onChange(null)}
        name={radioGroupName}
        isLoading={isLoading}
        data-cy={`${dataCy}-total`}
      />

      <Separator />

      {segments.map(({ key, label, count, color }) => (
        <FilterBarButton
          key={key}
          color={color}
          count={count}
          label={label}
          isSelected={value === key}
          onClick={() => handleSegmentClick(key)}
          name={radioGroupName}
          data-cy={`${dataCy}-${key}`}
        />
      ))}

      {activeLabel && (
        <div className="ml-auto hidden xl:flex">
          <Separator />
          <FilterBarActiveIndicator
            label={activeLabel}
            onClear={() => onChange(null)}
          />
        </div>
      )}
    </div>
  );
}

function Separator() {
  return (
    <div
      className="w-px shrink-0 self-stretch bg-[var(--border-widget)]"
      aria-hidden="true"
    />
  );
}
