import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { EditPollingWidget } from './EditPollingWidget';
import { SettingsFormValues } from './types';

vi.mock(
  '@/react/portainer/feature-flags/feature-flags.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/react/portainer/feature-flags/feature-flags.service')
    >()),
    isBE: false,
  })
);

function renderEditPollingWidget(pollingEnabled: boolean) {
  const initialValues: SettingsFormValues = {
    name: 'test-source',
    url: 'https://github.com/org/repo.git',
    tlsSkipVerify: false,
    authEnabled: false,
    username: '',
    password: '',
    pollingEnabled,
    interval: pollingEnabled ? '5m' : '',
  };

  return render(
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      <EditPollingWidget />
    </Formik>
  );
}

describe('EditPollingWidget', () => {
  it('explains that the interval only applies to regular stacks when polling is enabled', () => {
    renderEditPollingWidget(true);

    expect(screen.getByText(/only applies to regular stacks/i)).toBeVisible();
  });

  it('does not show the tip when polling is disabled', () => {
    renderEditPollingWidget(false);

    expect(
      screen.queryByText(/only applies to regular stacks/i)
    ).not.toBeInTheDocument();
  });
});
