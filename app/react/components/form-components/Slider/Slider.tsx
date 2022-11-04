import RcSlider from 'rc-slider';

import styles from './Slider.module.css';
import 'rc-slider/assets/index.css';

export interface Props {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
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
  const SliderWithTooltip = RcSlider.createSliderWithTooltip(RcSlider);
  // if the tooltip is always visible, hide the marks when tooltip value gets close to the edges
  const marks = {
    [min]: visible && value / max < 0.1 ? '' : translateMinValue(min),
    [max]: visible && value / max > 0.9 ? '' : max.toString(),
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
        tipProps={{ visible }}
        railStyle={{ height: 8 }}
        trackStyle={{ height: 8 }}
        dotStyle={{ visibility: 'hidden' }}
        data-cy={dataCy}
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
