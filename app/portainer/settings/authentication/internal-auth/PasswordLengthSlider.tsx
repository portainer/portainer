import { useEffect, useState } from 'react';
import RcSlider from 'rc-slider';
import clsx from 'clsx';

import { Badge } from '@/portainer/components/Badge/Badge';

import 'rc-slider/assets/index.css';

import styles from './PasswordLengthSlider.module.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange(value: number): void;
}

type Strength = 'weak' | 'good' | 'strong' | 'veryStrong';
type BadgeProperties = { icon: string; color: string; text: string };

const badgeProperties: Record<
  Strength,
  { icon: string; color: string; text: string }
> = {
  weak: { icon: 'far fa-times-circle', color: 'red', text: 'Weak password' },
  good: { icon: 'far fa-check-circle', color: 'yellow', text: 'Good password' },
  strong: {
    icon: 'far fa-check-circle',
    color: 'green',
    text: 'Strong password',
  },
  veryStrong: {
    icon: 'fa fa-lock',
    color: 'blue',
    text: 'Very strong password',
  },
};

const SliderWithTooltip = RcSlider.createSliderWithTooltip(RcSlider);

export function PasswordLengthSlider({
  min,
  max,
  step,
  value,
  onChange,
}: Props) {
  const [badgeProps, setBadgeProps] = useState<BadgeProperties>({
    icon: '',
    color: '',
    text: '',
  });

  function getBadgeProps(value: number) {
    if (value < 10) {
      return badgeProperties.weak;
    }

    if (value < 12) {
      return badgeProperties.good;
    }

    if (value < 14) {
      return badgeProperties.strong;
    }

    return badgeProperties.veryStrong;
  }

  useEffect(() => {
    setBadgeProps(getBadgeProps(value));
  }, [value]);

  function handleChange(sliderValue: number) {
    onChange(sliderValue);
    setBadgeProps(getBadgeProps(sliderValue));
  }

  return (
    <>
      <div className="col-sm-4">
        <SliderWithTooltip
          tipFormatter={(value) => `${value} characters`}
          min={min}
          max={max}
          step={step}
          defaultValue={12}
          value={value}
          onChange={handleChange}
        />
      </div>

      <div className={clsx('col-sm-2', styles.sliderBadge)}>
        <Badge
          value={badgeProps.text}
          icon={`${badgeProps.icon} space-right`}
        />
      </div>
    </>
  );
}
