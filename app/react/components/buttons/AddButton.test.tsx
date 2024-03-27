import { UIView } from '@uirouter/react';
import { render } from '@testing-library/react';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { AddButton } from './AddButton';

function renderDefault({
  label = 'default label',
}: Partial<{ label: string }> = {}) {
  const Wrapped = withTestRouter(AddButton, {
    stateConfig: [
      {
        name: 'root',
        url: '/',

        component: () => (
          <>
            <div>Root</div>
            <UIView />
          </>
        ),
      },
      {
        name: 'root.new',
        url: 'new',
      },
    ],
    route: 'root',
  });
  return render(
    <Wrapped to="" data-cy="wrapped">
      {label}
    </Wrapped>
  );
}

test('should display a AddButton component', async () => {
  const label = 'test label';

  const { findByText } = renderDefault({ label });

  const buttonLabel = await findByText(label);
  expect(buttonLabel).toBeTruthy();
});
