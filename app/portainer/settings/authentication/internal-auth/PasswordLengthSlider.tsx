// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-nested-ternary */
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
  defaultValue: number;
}

export function PasswordLengthSlider({ min, max, step, defaultValue }: Props) {
  const SliderWithTooltip = RcSlider.createSliderWithTooltip(RcSlider);
  const [labelProperties, setLabelProperties] = useState({
    sliderValue: 0,
    icon: '',
    strength: '',
    labelColor: '',
  });

  useEffect(() => {
    const icon =
      defaultValue < 10
        ? 'fa-times-circle'
        : defaultValue < 12
        ? 'fa-check-circle'
        : defaultValue < 14
        ? 'fa-check-circle'
        : 'fa-lock';
    const strength =
      defaultValue < 10
        ? 'Weak'
        : defaultValue < 12
        ? 'Good'
        : defaultValue < 14
        ? 'Strong'
        : 'Very strong';
    const labelColor =
      defaultValue < 10
        ? 'red'
        : defaultValue < 12
        ? 'yellow'
        : defaultValue < 14
        ? 'green'
        : 'blue';

    setLabelProperties({
      sliderValue: defaultValue,
      icon,
      strength,
      labelColor,
    });
  }, [defaultValue]);

  function onAfterChange(value: number) {
    const icon =
      value < 10
        ? 'fa-times-circle'
        : value < 12
        ? 'fa-check-circle'
        : value < 14
        ? 'fa-check-circle'
        : 'fa-lock';
    const strength =
      value < 10
        ? 'Weak'
        : value < 12
        ? 'Good'
        : value < 14
        ? 'Strong'
        : 'Very strong';
    const labelColor =
      value < 10
        ? 'red'
        : value < 12
        ? 'yellow'
        : value < 14
        ? 'green'
        : 'blue';

    setLabelProperties({ sliderValue: value, icon, strength, labelColor });
  }

  return (
    <>
      <div className="col-sm-4">
        <SliderWithTooltip
          tipFormatter={(value) => `${value} characters`}
          min={min}
          max={max}
          step={step}
          defaultValue={labelProperties.sliderValue}
          onAfterChange={onAfterChange}
        />
      </div>

      <div className={clsx('col-sm-2', styles.sliderBadge)}>
        <Badge
          value={`${labelProperties.strength} password`}
          icon={`far ${labelProperties.icon} space-right`}
        />
      </div>
    </>
  );
}
