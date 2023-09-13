import { useCallback } from 'react';
import RcSlider from 'rc-slider';
import clsx from 'clsx';
import { Lock, XCircle, CheckCircle } from 'lucide-react';

import { SliderTooltip } from '@@/Tip/SliderTooltip';

import 'rc-slider/assets/index.css';

import { Badge } from '../Badge';

import styles from './PasswordLengthSlider.module.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange(value: number | number[]): void;
}

type Strength = 'weak' | 'good' | 'strong' | 'veryStrong';

const sliderProperties: Record<
  Strength,
  { strength: string; color: string; text: string }
> = {
  weak: {
    strength: 'weak',
    color: '#F04438',
    text: 'Weak password',
  },
  good: {
    strength: 'good',
    color: '#F79009',
    text: 'Good password',
  },
  strong: {
    strength: 'strong',
    color: '#12B76A',
    text: 'Strong password',
  },
  veryStrong: {
    strength: 'veryStrong',
    color: '#0BA5EC',
    text: 'Very strong password',
  },
};

export function PasswordLengthSlider({
  min,
  max,
  step,
  value,
  onChange,
}: Props) {
  const sliderProps = getSliderProps(value);

  function getSliderProps(value: number) {
    if (value < 10) {
      return sliderProperties.weak;
    }

    if (value < 12) {
      return sliderProperties.good;
    }

    if (value < 14) {
      return sliderProperties.strong;
    }

    return sliderProperties.veryStrong;
  }

  function getBadgeIcon(strength: string) {
    switch (strength) {
      case 'weak':
        return <XCircle size="13" className="space-right" strokeWidth="3px" />;
      case 'good':
      case 'strong':
        return (
          <CheckCircle size="13" className="space-right" strokeWidth="3px" />
        );
      default:
        return <Lock size="13" className="space-right" strokeWidth="3px" />;
    }
  }

  function handleChange(sliderValue: number | number[]) {
    onChange(sliderValue);
  }

  const sliderTooltip = useCallback(
    (node, handleProps) => (
      <SliderTooltip
        value={`${handleProps.value} characters`}
        child={node}
        delay={800}
      />
    ),
    []
  );

  return (
    <div className={clsx(styles.root, styles[sliderProps.strength])}>
      <div className="col-sm-4">
        <RcSlider
          handleRender={sliderTooltip}
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
          icon={getBadgeIcon(sliderProps.strength)}
          value={sliderProps.text}
          color={sliderProps.color}
        />
      </div>
    </div>
  );
}
