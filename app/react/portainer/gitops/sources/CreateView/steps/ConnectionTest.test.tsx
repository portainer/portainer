import { render, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

import { FormValues } from '../type';

import { ConnectionTest } from './ConnectionTest';

const baseGitValues: FormValues['git'] = {
  url: 'https://github.com/org/repo.git',
  tlsSkipVerify: false,
  connectionOk: false,
  authentication: {
    authEnabled: false,
  },
};

const invalidGitValues: FormValues['git'] = {
  url: '',
  tlsSkipVerify: false,
  connectionOk: false,
  authentication: {
    authEnabled: false,
  },
};

function renderConnectionTest(gitValues: FormValues['git']) {
  const initialValues: FormValues = {
    name: 'test-source',
    type: 'git',
    git: gitValues,
    authorizedTeams: [],
    authorizedUsers: [],
    ownership: ResourceControlOwnership.ADMINISTRATORS,
  };

  const Wrapped = withTestQueryProvider(ConnectionTest);

  return render(
    <Formik initialValues={initialValues} onSubmit={() => {}}>
      <Wrapped />
    </Formik>
  );
}

describe('ConnectionTest', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when git URL is empty', () => {
    renderConnectionTest(invalidGitValues);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows "Testing connection…" while debounce is pending, then success', async () => {
    server.use(
      http.post('/api/gitops/sources/test', () =>
        HttpResponse.json({ success: true })
      )
    );

    renderConnectionTest(baseGitValues);

    expect(screen.getByText('Testing connection...')).toBeInTheDocument();
    expect(screen.queryByText('Connection successful')).not.toBeInTheDocument();

    // Advance past the debounce
    await vi.advanceTimersByTimeAsync(600);

    await waitFor(() => {
      expect(screen.getByText('Connection successful')).toBeVisible();
    });
    expect(screen.queryByText('Testing connection...')).not.toBeInTheDocument();
  });

  it('shows success alert when gitOpsSourcesTest returns success:true', async () => {
    server.use(
      http.post('/api/gitops/sources/test', () =>
        HttpResponse.json({ success: true })
      )
    );

    renderConnectionTest(baseGitValues);

    await vi.advanceTimersByTimeAsync(600);

    await waitFor(() => {
      expect(screen.getByText('Connection successful')).toBeVisible();
    });
  });

  it('shows failure alert when gitOpsSourcesTest returns success:false', async () => {
    server.use(
      http.post('/api/gitops/sources/test', () =>
        HttpResponse.json({ success: false, error: 'Repository not found' })
      )
    );

    renderConnectionTest(baseGitValues);

    await vi.advanceTimersByTimeAsync(600);

    await waitFor(() => {
      expect(screen.getByText('Repository not found')).toBeVisible();
    });
  });

  it('shows failure alert when the API returns an error', async () => {
    const restoreConsole = suppressConsoleLogs();

    server.use(
      http.post('/api/gitops/sources/test', () =>
        HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderConnectionTest(baseGitValues);

    await vi.advanceTimersByTimeAsync(600);

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeVisible();
    });

    restoreConsole();
  });
});
