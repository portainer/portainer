import clsx from 'clsx';
import ReactTooltip from 'react-tooltip';

import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';
import { Icon } from '@/react/components/Icon';

import './BoxSelectorItem.css';

import { BoxSelectorOption } from './types';
import { LimitedToBeIndicator } from './LimitedToBeIndicator';

interface Props<T extends number | string> {
  radioName: string;
  option: BoxSelectorOption<T>;
  onChange(value: T, limitedToBE: boolean): void;
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
  const limitedToBE = isLimitedToBE(option.feature);

  const tooltipId = `box-selector-item-${radioName}-${option.id}`;
  const beIndicatorTooltipId = `box-selector-item-${radioName}-${option.id}-limited`;
  return (
    <div
      className={clsx('box-selector-item', {
        business: limitedToBE,
        limited: limitedToBE,
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
        onChange={() => onChange(option.value, limitedToBE)}
      />

      <label htmlFor={option.id} data-cy={`${radioName}_${option.value}`}>
        {limitedToBE && (
          <LimitedToBeIndicator tooltipId={beIndicatorTooltipId} />
        )}
        <div className={clsx({ 'opacity-30': limitedToBE })}>
          <div className="boxselector_img_container">
            {!!option.icon && (
              <Icon
                icon={option.icon}
                feather={option.featherIcon}
                className="boxselector_icon space-right"
              />
            )}
          </div>
          <div className="boxselector_header">{option.label}</div>
          <p className="box-selector-item-description">{option.description}</p>
        </div>
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
