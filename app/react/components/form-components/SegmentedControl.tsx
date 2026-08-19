import clsx from 'clsx';
import { ReactNode } from 'react';

import { useId } from '@/react/hooks/useId';

import { Tabs } from '@@/primitives/Tabs/Tabs';

export interface SegmentItem {
  id: string;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
}

export type SegmentedControlVariant = 'contained' | 'pill';
export type SegmentedControlSize = 'sm' | 'md';

interface Props {
  items: SegmentItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  size?: SegmentedControlSize;
  variant?: SegmentedControlVariant;
  className?: string;
  label: string;
}

export function SegmentedControl({
  items,
  activeId,
  onChange,
  size = 'md',
  variant = 'contained',
  className,
  label,
}: Props) {
  const groupName = useId();

  return (
    <fieldset className={clsx('m-0 min-w-0 border-0 p-0', className)}>
      <legend className="sr-only">{label}</legend>
      <Tabs.Container variant={variant} size={size}>
        {items.map((item) => (
          <SegmentedControlItem
            key={item.id}
            item={item}
            isActive={item.id === activeId}
            groupName={groupName}
            onChange={onChange}
          />
        ))}
      </Tabs.Container>
    </fieldset>
  );
}

interface ItemProps {
  item: SegmentItem;
  isActive: boolean;
  groupName: string;
  onChange?: (id: string) => void;
}

function SegmentedControlItem({
  item,
  isActive,
  groupName,
  onChange,
}: ItemProps) {
  return (
    <Tabs.Item
      asChild
      isActive={isActive}
      disabled={item.disabled}
      className="m-0"
    >
      <label title={item.title}>
        <input
          type="radio"
          name={groupName}
          value={item.id}
          checked={isActive}
          disabled={item.disabled}
          onChange={() => onChange?.(item.id)}
          className="sr-only"
          aria-label={item.title}
        />
        {item.label}
      </label>
    </Tabs.Item>
  );
}
