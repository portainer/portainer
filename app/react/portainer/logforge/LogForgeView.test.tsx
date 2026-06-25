import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { UserViewModel } from '@/portainer/models/user';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';

import { LogForgeView } from './LogForgeView';
import { LogForgeStatus } from './types';

const mocks = vi.hoisted(() => ({
  useLogForgeStatus: vi.fn(),
  useInstallOrRegisterLogForgeMutation: vi.fn(),
  useUninstallOrClearLogForgeMutation: vi.fn(),
  useEnvironmentList: vi.fn(),
  notifySuccess: vi.fn(),
  confirmDelete: vi.fn(),
}));

vi.mock('./queries', () => ({
  useLogForgeStatus: () => mocks.useLogForgeStatus(),
  useInstallOrRegisterLogForgeMutation: () =>
    mocks.useInstallOrRegisterLogForgeMutation(),
  useUninstallOrClearLogForgeMutation: () =>
    mocks.useUninstallOrClearLogForgeMutation(),
}));

vi.mock('@/react/portainer/environments/queries/useEnvironmentList', () => ({
  useEnvironmentList: () => mocks.useEnvironmentList(),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifySuccess: mocks.notifySuccess,
}));

vi.mock('@@/modals/confirm', () => ({
  confirmDelete: mocks.confirmDelete,
}));

beforeEach(() => {
  vi.clearAllMocks();
  setStatus(createStatus());
  setEnvironmentList();
  setMutations();
  mocks.confirmDelete.mockResolvedValue(true);
});

test('submits an external appliance registration payload', async () => {
  const user = userEvent.setup();
  const installMutate = vi.fn();
  setMutations({ installMutate });

  const { container } = renderComponent();

  fireEvent.change(
    getByDataCy<HTMLInputElement>(container, 'logforge-appliance-url'),
    {
      target: { value: ' https://logforge.example.com ' },
    }
  );

  await user.click(screen.getByRole('button', { name: 'Register LogForge' }));

  expect(installMutate).toHaveBeenCalledWith(
    { ApplianceUrl: 'https://logforge.example.com' },
    expect.objectContaining({ onSuccess: expect.any(Function) })
  );
});

test('submits a managed install payload for a Docker environment', async () => {
  const user = userEvent.setup();
  const installMutate = vi.fn();
  setEnvironmentList([{ Id: 1, Name: 'local-docker' }]);
  setMutations({ installMutate });

  const { container } = renderComponent();

  await user.click(screen.getByRole('button', { name: 'Install' }));
  fireEvent.change(
    getByDataCy<HTMLSelectElement>(container, 'logforge-environment-select'),
    { target: { value: '1' } }
  );
  fireEvent.change(
    getByDataCy<HTMLInputElement>(container, 'logforge-stack-name'),
    {
      target: { value: 'logforge-hardening' },
    }
  );
  fireEvent.change(getByDataCy<HTMLInputElement>(container, 'logforge-image'), {
    target: { value: 'logforge/unicron:latest' },
  });
  fireEvent.change(
    getByDataCy<HTMLInputElement>(container, 'logforge-central-fqdn'),
    {
      target: { value: 'localhost' },
    }
  );
  fireEvent.change(
    getByDataCy<HTMLInputElement>(container, 'logforge-https-port'),
    {
      target: { value: '19444' },
    }
  );
  fireEvent.change(
    getByDataCy<HTMLInputElement>(container, 'logforge-mtls-port'),
    {
      target: { value: '18443' },
    }
  );
  fireEvent.change(
    getByDataCy<HTMLInputElement>(container, 'logforge-appliance-url'),
    {
      target: { value: 'https://172.17.0.1:19444' },
    }
  );

  await user.click(screen.getByRole('button', { name: 'Install LogForge' }));

  expect(installMutate).toHaveBeenCalledWith(
    {
      EndpointId: 1,
      ApplianceUrl: 'https://172.17.0.1:19444',
      Image: 'logforge/unicron:latest',
      StackName: 'logforge-hardening',
      CentralFQDN: 'localhost',
      HTTPSPort: 19444,
      MTLSPort: 18443,
    },
    expect.objectContaining({ onSuccess: expect.any(Function) })
  );
});

test('opens the embedded UI and clears or removes a managed appliance', async () => {
  const user = userEvent.setup();
  const uninstallMutate = vi.fn();
  setStatus(
    createStatus({
      Enabled: true,
      Managed: true,
      ApplianceUrl: 'https://172.17.0.1:19444',
      StackName: 'logforge-hardening',
      Stack: {
        Id: 2,
        Name: 'logforge-hardening',
        EndpointId: 1,
        Status: 1,
      },
      Health: { Status: 'healthy', Message: '{"status":"ok"}' },
    })
  );
  setMutations({ uninstallMutate });

  renderComponent();

  await user.click(screen.getByRole('button', { name: 'Open embedded UI' }));

  expect(screen.getByTitle('LogForge')).toHaveAttribute('src', '/logforge/ui/');
  expect(
    screen.getByRole('button', { name: 'Back to status' })
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Back to status' }));

  await user.click(screen.getByRole('button', { name: 'Clear registration' }));

  await waitFor(() => {
    expect(uninstallMutate).toHaveBeenCalledWith(
      { RemoveManagedStack: false },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  await user.click(
    screen.getByRole('button', { name: 'Remove managed appliance' })
  );

  await waitFor(() => {
    expect(uninstallMutate).toHaveBeenLastCalledWith(
      { RemoveManagedStack: true },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});

test('shows status but blocks the embedded UI for users without Docker endpoint access', () => {
  setStatus(
    createStatus({
      Enabled: true,
      Managed: false,
      ApplianceUrl: 'https://logforge.example.test',
      Access: {
        Allowed: false,
        IsAdmin: false,
        UserId: 2,
        Username: 'standard',
        Endpoints: [],
      },
    })
  );

  renderComponent(2);

  expect(screen.getByText('Appliance status')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Open embedded UI' })).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Clear registration' })
  ).toBeNull();
  expect(screen.getByText('Access limited')).toBeInTheDocument();
});

test('does not show setup controls to non-admin users before LogForge is configured', () => {
  setStatus(
    createStatus({
      Access: {
        Allowed: false,
        IsAdmin: false,
        UserId: 2,
        Username: 'standard',
        Endpoints: [],
      },
    })
  );

  renderComponent(2);

  expect(screen.getByText('Not configured')).toBeInTheDocument();
  expect(screen.queryByText('Setup')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Register LogForge' })
  ).toBeNull();
  expect(
    screen.getByText(
      'LogForge is not configured. Ask a Portainer administrator to configure a central appliance.'
    )
  ).toBeInTheDocument();
});

function renderComponent(role = 1) {
  const user = new UserViewModel({ Username: 'admin', Role: role });
  const Routed = withTestRouter(LogForgeView);
  const Wrapped = withTestQueryProvider(withUserProvider(Routed, user));

  return render(<Wrapped />);
}

function createStatus(overrides: Partial<LogForgeStatus> = {}): LogForgeStatus {
  const { Health, Access, ...rest } = overrides;

  return {
    Enabled: false,
    Managed: false,
    BrowserProxyPath: '/logforge/ui/',
    ManagedAuthReady: true,
    Access: {
      Allowed: true,
      IsAdmin: true,
      UserId: 1,
      Username: 'admin',
      Endpoints: [{ Id: 1, Name: 'local-docker', Role: 'admin', RoleId: 1 }],
      ...Access,
    },
    ...rest,
    Health: {
      Status: 'not_configured',
      ...Health,
    },
  };
}

function setStatus(status: LogForgeStatus) {
  mocks.useLogForgeStatus.mockReturnValue({
    data: status,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn().mockResolvedValue(status),
  });
}

function setEnvironmentList(
  environments: Array<{ Id: number; Name: string }> = []
) {
  mocks.useEnvironmentList.mockReturnValue({
    environments,
    isLoading: false,
  });
}

function setMutations({
  installMutate = vi.fn(),
  uninstallMutate = vi.fn(),
}: {
  installMutate?: ReturnType<typeof vi.fn>;
  uninstallMutate?: ReturnType<typeof vi.fn>;
} = {}) {
  mocks.useInstallOrRegisterLogForgeMutation.mockReturnValue({
    mutate: installMutate,
    isLoading: false,
  });
  mocks.useUninstallOrClearLogForgeMutation.mockReturnValue({
    mutate: uninstallMutate,
    isLoading: false,
  });
}

function getByDataCy<T extends HTMLElement>(
  container: HTMLElement,
  dataCy: string
) {
  const element = container.querySelector(`[data-cy="${dataCy}"]`);
  expect(element).toBeInTheDocument();

  return element as T;
}
