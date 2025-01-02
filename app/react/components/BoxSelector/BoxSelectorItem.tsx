import clsx from 'clsx';
import { type LucideIcon, Check } from 'lucide-react';
import { Fragment } from 'react';

import { Icon } from '@/react/components/Icon';

import { BadgeIcon } from '@@/BadgeIcon';
import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

import styles from './BoxSelectorItem.module.css';
import { BoxSelectorOption, Value } from './types';
import { LimitedToBeBoxSelectorIndicator } from './LimitedToBeBoxSelectorIndicator';
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
  checkIcon?: LucideIcon;
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
        <LimitedToBeBoxSelectorIndicator
          url={featureUrl}
          // show tooltip only for radio type options because be-only checkbox options can't be selected
          showTooltip={type === 'radio'}
        />
      )}
      <div
        className={clsx('flex min-w-[140px] gap-2', {
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
      return <BadgeIcon icon={option.icon} iconClass={option.iconClass} />;
    }

    if (option.iconType === 'raw') {
      return (
        <Icon
          icon={option.icon}
          className={clsx(styles.icon, option.iconClass, '!flex items-center')}
        />
      );
    }

    return <LogoIcon icon={option.icon} iconClass={option.iconClass} />;
  }
}
