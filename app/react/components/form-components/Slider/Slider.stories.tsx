import { Meta, Story } from '@storybook/react';
import { useEffect, useState } from 'react';

import { Slider, Props } from './Slider';

export default {
  component: Slider,
  title: 'Components/Form/Slider',
} as Meta;

function Template({
  value,
  min,
  max,
  step,
  dataCy,
  visibleTooltip,
}: JSX.IntrinsicAttributes & Props) {
  const [sliderValue, setSliderValue] = useState(min);

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  return (
    <Slider
      min={min}
      max={max}
      step={step}
      value={sliderValue}
      onChange={setSliderValue}
      dataCy={dataCy}
      visibleTooltip={visibleTooltip}
    />
  );
}

export const Primary: Story<Props> = Template.bind({});
Primary.args = {
  min: 0,
  max: 100,
  step: 1,
  value: 5,
  visibleTooltip: true,
  dataCy: 'someView-coolSlider',
};
