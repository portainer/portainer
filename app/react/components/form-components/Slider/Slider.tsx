import { ReactElement } from 'react';
import RcSlider from 'rc-slider';
import { HandleProps } from 'rc-slider/lib/Handles/Handle';

import { SliderTooltip } from '@@/Tip/SliderTooltip';

import styles from './Slider.module.css';

import 'rc-slider/assets/index.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number | number[]) => void;
  dataCy: string;
  // true if you want to always show the tooltip
  visibleTooltip?: boolean;
  disabled?: boolean;
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  dataCy,
  visibleTooltip: visible,
  disabled,
}: Props) {
  const marks = {
    [min]: visible && value / max < 0.1 ? '' : translateMinValue(min),
    [max]: visible && value / max > 0.9 ? '' : max.toString(),
  };

  return (
    <div className={styles.root} data-cy={dataCy}>
      <RcSlider
        handleRender={visible ? sliderTooltip : undefined}
        min={min}
        max={max}
        marks={marks}
        step={step}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function translateMinValue(value: number) {
  if (value === 0) {
    return 'unlimited';
  }
  return value.toString();
}

function sliderTooltip(
  node: ReactElement<HandleProps>,
  handleProps: { value: number }
) {
  return (
    <SliderTooltip
      value={translateMinValue(handleProps.value)}
      child={node}
      delay={0}
    />
  );
}
