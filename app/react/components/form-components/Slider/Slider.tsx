import { useCallback } from 'react';
import RcSlider from 'rc-slider';

import { SliderTooltip } from '@@/Tip/SliderTooltip';

import styles from './Slider.module.css';
import 'rc-slider/assets/index.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number | number[]) => void;
  // true if you want to always show the tooltip
  dataCy: string;
  visibleTooltip?: boolean;
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  dataCy,
  visibleTooltip: visible,
}: Props) {
  const marks = {
    [min]: visible && value / max < 0.1 ? '' : translateMinValue(min),
    [max]: visible && value / max > 0.9 ? '' : max.toString(),
  };

  const sliderTooltip = useCallback(
    (node, handleProps) => (
      <SliderTooltip
        value={translateMinValue(handleProps.value)}
        child={node}
        delay={0}
      />
    ),
    []
  );

  return (
    <div className={styles.root}>
      <RcSlider
        handleRender={sliderTooltip}
        min={min}
        max={max}
        marks={marks}
        step={step}
        data-cy={dataCy}
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
