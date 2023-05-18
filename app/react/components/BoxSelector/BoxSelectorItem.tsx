import clsx from 'clsx';
import { Icon as ReactFeatherComponentType, Check } from 'lucide-react';
import { Fragment } from 'react';

import { Icon } from '@/react/components/Icon';

import { BadgeIcon } from '@@/BadgeIcon';
import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

import styles from './BoxSelectorItem.module.css';
import { BoxSelectorOption, Value } from './types';
import { LimitedToBeIndicator } from './LimitedToBeIndicator';
import { BoxOption } from './BoxOption';
import { LogoIcon } from './LogoIcon';

type Props<T extends Value> = {
  option: BoxSelectorOption<T>;
  radioName: string;
  disabled?: boolean;
  tooltip?: string;
  onSelect(value: T, limitedToBE: boolean): void;
  isSelected(value: T): boolean;
  type?: 'radio' | 'checkbox';
  slim?: boolean;
  checkIcon?: ReactFeatherComponentType;
};

export function BoxSelectorItem<T extends Value>({
  radioName,
  option,
  onSelect = () => {},
  disabled,
  tooltip,
  type = 'radio',
  isSelected,
  slim = false,
  checkIcon = Check,
}: Props<T>) {
  const { limitedToBE = false, url: featureUrl } = getFeatureDetails(
    option.feature
  );

  const beIndicatorTooltipId = `box-selector-item-${radioName}-${option.id}-limited`;

  const ContentBox = slim ? 'div' : Fragment;

  return (
    <BoxOption
      className={clsx(styles.boxSelectorItem, {
        [styles.business]: limitedToBE,
        [styles.limited]: limitedToBE,
      })}
      radioName={radioName}
      option={option}
      isSelected={isSelected}
      disabled={isDisabled()}
      onSelect={(value) => onSelect(value, limitedToBE)}
      tooltip={tooltip}
      type={type}
      checkIcon={checkIcon}
    >
      {limitedToBE && (
        <LimitedToBeIndicator
          tooltipId={beIndicatorTooltipId}
          url={featureUrl}
        />
      )}
      <div
        className={clsx('flex gap-2', {
          'opacity-30': limitedToBE,
          'h-full flex-col justify-start': !slim,
          'slim items-center': slim,
        })}
      >
        <div className={clsx(styles.imageContainer, 'flex items-start')}>
          {renderIcon()}
        </div>
        <ContentBox>
          <div className={styles.header}>{option.label}</div>
          <p className="mb-0">{option.description}</p>
        </ContentBox>
      </div>
    </BoxOption>
  );

  function isDisabled() {
    return disabled || (limitedToBE && option.disabledWhenLimited);
  }

  function renderIcon() {
    if (!option.icon) {
      return null;
    }

    if (option.iconType === 'badge') {
      return <BadgeIcon icon={option.icon} />;
    }

    if (option.iconType === 'raw') {
      return (
        <Icon
          icon={option.icon}
          className={clsx(styles.icon, '!flex items-center')}
        />
      );
    }

    return <LogoIcon icon={option.icon} />;
  }
}
