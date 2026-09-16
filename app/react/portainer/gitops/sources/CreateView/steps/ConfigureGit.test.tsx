import { render, screen } from '@testing-library/react';
import { Formik } from 'formik';

import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { FormValues } from '../type';

import { ConfigureGit } from './ConfigureGit';

vi.mock(
  '@/react/portainer/feature-flags/feature-flags.service',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@/react/portainer/feature-flags/feature-flags.service')
    >()),
    isBE: false,
  })
);

vi.mock('./ConnectionTest', () => ({
  ConnectionTest: () => null,
}));

function renderConfigureGit(polling: FormValues['git']['polling']) {
  const initialValues: FormValues = {
    name: 'test-source',
    type: 'git',
    git: {
      url: 'https://github.com/org/repo.git',
      tlsSkipVerify: false,
      connectionOk: false,
      authentication: {
        authEnabled: false,
      },
      polling,
    },
    authorizedTeams: [],
    authorizedUsers: [],
    ownership: ResourceControlOwnership.ADMINISTRATORS,
  };

  return render(
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      <ConfigureGit />
    </Formik>
  );
}

describe('ConfigureGit', () => {
  it('explains that the interval only applies to regular stacks when polling is enabled', () => {
    renderConfigureGit({ enabled: true, interval: '5m' });

    expect(screen.getByText(/only applies to regular stacks/i)).toBeVisible();
  });

  it('does not show the tip when polling is disabled', () => {
    renderConfigureGit({ enabled: false, interval: '' });

    expect(
      screen.queryByText(/only applies to regular stacks/i)
    ).not.toBeInTheDocument();
  });
});
