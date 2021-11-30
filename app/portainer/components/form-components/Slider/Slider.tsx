import RcSlider from 'rc-slider';

import styles from './Slider.module.css';
import 'rc-slider/assets/index.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

export function Slider({ min, max, step, value, onChange }: Props) {
  const SliderWithTooltip = RcSlider.createSliderWithTooltip(RcSlider);
  const marks = {
    [min]: translateMinValue(min),
    [max]: max.toString(),
  };

  return (
    <div className={styles.root}>
      <SliderWithTooltip
        tipFormatter={translateMinValue}
        min={min}
        max={max}
        step={step}
        marks={marks}
        defaultValue={value}
        onAfterChange={onChange}
        className={styles.slider}
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
