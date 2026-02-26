import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, DefaultBodyType } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import {
  createMockUsers,
  createMockEnvironment,
} from '@/react-tools/test-mocks';
import { withCurrentUser } from '@/react-tools/withCurrentUser';

import { AzureEnvironmentForm } from './AzureEnvironmentForm';

test('renders form with initial values', async () => {
  renderComponent({
    environment: createMockEnvironment({
      Name: 'azure-env',
      URL: 'https://azure.example.com',
      AzureCredentials: {
        ApplicationID: 'app-123',
        TenantID: 'tenant-456',
        AuthenticationKey: 'key-789',
      },
    }),
  });

  expect(await screen.findByRole('textbox', { name: /Name/i })).toHaveValue(
    'azure-env'
  );
  expect(screen.getByLabelText(/Environment URL/i)).toHaveValue(
    'https://azure.example.com'
  );
  expect(screen.getByLabelText(/Application ID/i)).toHaveValue('app-123');
  expect(screen.getByLabelText(/Tenant ID/i)).toHaveValue('tenant-456');
  expect(
    screen.getByRole('button', { name: /Update environment/i })
  ).toBeVisible();
});

test('submits form with updated values', async () => {
  const user = userEvent.setup();
  let requestBody: DefaultBodyType;

  server.use(
    http.put('/api/endpoints/:id', async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json(createMockEnvironment());
    })
  );

  const onSuccess = vi.fn();
  renderComponent({
    environment: createMockEnvironment({
      Name: 'azure-env',
      URL: 'https://azure.example.com',
      AzureCredentials: {
        ApplicationID: 'app-123',
        TenantID: 'tenant-456',
        AuthenticationKey: 'key-789',
      },
    }),
    onSuccess,
  });

  const nameInput = await screen.findByRole('textbox', { name: /Name/i });
  await user.clear(nameInput);
  await user.type(nameInput, 'updated-azure-env');

  const submitButton = screen.getByRole('button', {
    name: /Update environment/i,
  });

  await waitFor(() => {
    expect(submitButton).toBeEnabled();
  });

  await user.click(submitButton);

  await waitFor(() => {
    expect(onSuccess).toHaveBeenCalled();

    expect(requestBody).toMatchObject({
      Name: 'updated-azure-env',
      GroupID: 1,
      TagIds: [],
      AzureApplicationID: 'app-123',
      AzureTenantID: 'tenant-456',
    });
  });
});

function renderComponent({
  environment = createMockEnvironment(),
  onSuccess = vi.fn(),
}: {
  environment?: ReturnType<typeof createMockEnvironment>;
  onSuccess?: () => void;
} = {}) {
  const users = createMockUsers(1, [1]);

  server.use(
    http.get('/api/users/:id', () => HttpResponse.json(users[0])),
    http.get('/api/endpoints', () =>
      HttpResponse.json({ value: [], totalCount: 0 })
    ),
    http.get('/api/endpoint_groups', () =>
      HttpResponse.json([{ Id: 1, Name: 'Default' }])
    ),
    http.get('/api/tags', () => HttpResponse.json([]))
  );

  const Wrapped = withCurrentUser(
    withTestQueryProvider(withTestRouter(AzureEnvironmentForm))
  );

  return render(<Wrapped environment={environment} onSuccess={onSuccess} />);
}
