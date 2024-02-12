import { render } from '@/react-tools/test-utils';

import { AddButton } from './AddButton';

function renderDefault({
  label = 'default label',
}: Partial<{ label: string }> = {}) {
  return render(<AddButton to="">{label}</AddButton>);
}

test('should display a AddButton component', async () => {
  const label = 'test label';

  const { findByText } = renderDefault({ label });

  const buttonLabel = await findByText(label);
  expect(buttonLabel).toBeTruthy();
});
