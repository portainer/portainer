import { render } from '@testing-library/react';

import { Slider, Props } from './Slider';

function renderDefault({
  min = 0,
  max = 10,
  step = 1,
  value = min,
  onChange = () => {},
  dataCy = 'someView-coolSlider',
  visibleTooltip = true,
}: Partial<Props> = {}) {
  return render(
    <Slider
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      value={value}
      visibleTooltip={visibleTooltip}
      dataCy={dataCy}
    />
  );
}

test('should display a Slider component', async () => {
  const { getByRole } = renderDefault({});

  const handle = getByRole('slider');
  expect(handle).toBeTruthy();
});
