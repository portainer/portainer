import clsx from 'clsx';

import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';
import { Icon } from '@/react/components/Icon';

import './BoxSelectorItem.css';

import { BoxSelectorOption } from './types';
import { LimitedToBeIndicator } from './LimitedToBeIndicator';
import { BoxOption } from './BoxOption';

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

  const beIndicatorTooltipId = `box-selector-item-${radioName}-${option.id}-limited`;
  return (
    <BoxOption
      className={clsx({
        business: limitedToBE,
        limited: limitedToBE,
      })}
      radioName={radioName}
      option={option}
      selectedValue={selectedValue}
      disabled={disabled}
      onChange={(value) => onChange(value, limitedToBE)}
      tooltip={tooltip}
    >
      <>
        {limitedToBE && (
          <LimitedToBeIndicator
            tooltipId={beIndicatorTooltipId}
            featureId={option.feature}
          />
        )}
        <div className={clsx({ 'opacity-30': limitedToBE })}>
          <div className="boxselector_img_container">
            {!!option.icon && (
              <Icon
                icon={option.icon}
                feather={option.featherIcon}
                className="boxselector_icon !flex items-center"
              />
            )}
          </div>
          <div className="boxselector_header">{option.label}</div>
          <p className="box-selector-item-description">{option.description}</p>
        </div>
      </>
    </BoxOption>
  );
}
