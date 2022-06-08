import clsx from 'clsx';
import ReactTooltip from 'react-tooltip';

import { isLimitedFeature } from '@/portainer/feature-flags/feature-flags.service';

import './BoxSelectorItem.css';

import { BoxSelectorOption } from './types';

interface Props<T extends number | string> {
  radioName: string;
  option: BoxSelectorOption<T>;
  onChange(value: T, limitedFeature: boolean): void;
  selectedValue: T;
  disabled?: boolean;
  tooltip?: string;
}

export function BoxSelectorItem<T extends number | string>({
  radioName,
  option,
  onChange,
  selectedValue,
  disabled,
  tooltip,
}: Props<T>) {
  const limitedFeature = isLimitedFeature(option.feature);

  const tooltipId = `box-selector-item-${radioName}-${option.id}`;
  return (
    <div
      className={clsx('box-selector-item', {
        business: limitedFeature,
        limited: limitedFeature,
      })}
      data-tip
      data-for={tooltipId}
      tooltip-append-to-body="true"
      tooltip-placement="bottom"
      tooltip-class="portainer-tooltip"
    >
      <input
        type="radio"
        name={radioName}
        id={option.id}
        checked={option.value === selectedValue}
        value={option.value}
        disabled={disabled}
        onChange={() => onChange(option.value, limitedFeature)}
      />
      <label htmlFor={option.id} data-cy={`${radioName}_${option.value}`}>
        {limitedFeature && <i className="fas fa-briefcase limited-icon" />}

        <div className="boxselector_header">
          {!!option.icon && (
            <i
              className={clsx(option.icon, 'space-right')}
              aria-hidden="true"
            />
          )}
          {option.label}
        </div>

        <p className="box-selector-item-description">{option.description}</p>
      </label>
      {tooltip && (
        <ReactTooltip
          place="bottom"
          className="portainer-tooltip"
          id={tooltipId}
        >
          {tooltip}
        </ReactTooltip>
      )}
    </div>
  );
}
