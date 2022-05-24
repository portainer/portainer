import { useEffect, useState } from 'react';
import RcSlider from 'rc-slider';
import clsx from 'clsx';
import { Lock, XCircle, CheckCircle } from 'react-feather';

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
type SliderProperties = { strength: string; color: string; text: string };

const sliderProperties: Record<
  Strength,
  { strength: string; color: string; text: string }
> = {
  weak: {
    strength: 'weak',
    color: '#f32e21',
    text: 'Weak password',
  },
  good: {
    strength: 'good',
    color: '#f69300',
    text: 'Good password',
  },
  strong: {
    strength: 'strong',
    color: '#40c267',
    text: 'Strong password',
  },
  veryStrong: {
    strength: 'veryStrong',
    color: '#41b2f8',
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
  const [sliderProps, setSliderProps] = useState<SliderProperties>({
    strength: '',
    color: '',
    text: '',
  });

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
        return <XCircle size="15" className="space-right" />;
      case 'good':
      case 'strong':
        return <CheckCircle size="15" className="space-right" />;
      default:
        return <Lock size="15" className="space-right" />;
    }
  }

  useEffect(() => {
    setSliderProps(getSliderProps(value));
  }, [value]);

  function handleChange(sliderValue: number) {
    onChange(sliderValue);
    setSliderProps(getSliderProps(sliderValue));
  }

  return (
    <div style={{ marginLeft: 10, marginBottom: 50 }}>
      <div className="col-sm-4">
        <SliderWithTooltip
          tipFormatter={(value) => `${value} characters`}
          min={min}
          max={max}
          step={step}
          defaultValue={12}
          value={value}
          onChange={handleChange}
          handleStyle={{
            height: 25,
            width: 25,
            borderWidth: 1.85,
            borderColor: sliderProps.color,
            top: 1.5,
            boxShadow: 'none',
          }}
          railStyle={{ height: 10 }}
          trackStyle={{ backgroundColor: sliderProps.color, height: 10 }}
        />
      </div>

      <div className={clsx('col-sm-2', styles.sliderBadge)}>
        <Badge
          icon={getBadgeIcon(sliderProps.strength)}
          value={sliderProps.text}
        />
      </div>
    </div>
  );
}
