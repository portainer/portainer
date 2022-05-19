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

  const icons: Record<string, string> = {
    Weak: 'fa-times-circle',
    Good: 'fa-check-circle',
    Strong: 'fa-check-circle',
    'Very strong': 'fa-lock',
  };

  const colors: Record<string, string> = {
    Weak: 'red',
    Good: 'yellow',
    Strong: 'green',
    'Very strong': 'blue',
  };

  function getPasswordStrength(value: number) {
    let strength;

    if (value < 10) {
      strength = 'Weak';
    } else if (value < 12) {
      strength = 'Good';
    } else if (value < 14) {
      strength = 'Strong';
    } else {
      strength = 'Very strong';
    }

    return strength;
  }

  useEffect(() => {
    const strength = getPasswordStrength(defaultValue);
    const icon = icons[strength];
    const labelColor = colors[strength];

    setLabelProperties({
      sliderValue: defaultValue,
      icon,
      strength,
      labelColor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  function onAfterChange(value: number) {
    const strength = getPasswordStrength(value);
    const icon = icons[strength];
    const labelColor = colors[strength];

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
