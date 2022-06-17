import { render } from '@/react-tools/test-utils';

import { Slider, Props } from './Slider';

function renderDefault({
  min = 0,
  max = 10,
  step = 1,
  value = min,
  onChange = () => {},
}: Partial<Props> = {}) {
  return render(
    <Slider min={min} max={max} step={step} onChange={onChange} value={value} />
  );
}

test('should display a Slider component', async () => {
  const { getByRole } = renderDefault({});

  const handle = getByRole('slider');
  expect(handle).toBeTruthy();
});
