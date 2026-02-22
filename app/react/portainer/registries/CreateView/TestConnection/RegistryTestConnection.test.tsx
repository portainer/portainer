import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { RegistryTestConnection } from './RegistryTestConnection';

const defaultValues = {
  Username: 'testuser',
  Password: 'testpass',
};

const defaultProps = {
  values: defaultValues,
  onTestSuccess: vi.fn(),
  onTestReset: vi.fn(),
  disabled: false,
};

function renderComponent(props = {}) {
  const Wrapped = withTestQueryProvider(RegistryTestConnection);
  return render(<Wrapped {...defaultProps} {...props} />);
}

test('should render test connection button', () => {
  renderComponent();

  expect(screen.getByRole('button', { name: 'Test connection' })).toBeVisible();
});

test('should be disabled when disabled prop is true', () => {
  renderComponent({ disabled: true });

  expect(
    screen.getByRole('button', { name: 'Test connection' })
  ).toBeDisabled();
});

test('should be disabled when required fields are empty', () => {
  renderComponent({
    values: { Username: '', Password: '' },
  });

  expect(
    screen.getByRole('button', { name: 'Test connection' })
  ).toBeDisabled();
});

test('should show success message on successful test', async () => {
  const user = userEvent.setup();
  const onTestSuccess = vi.fn();

  // Mock successful response from the API
  server.use(
    http.post('/api/registries/ping', () =>
      HttpResponse.json({
        success: true,
        message: 'Registry connection successful',
      })
    )
  );

  renderComponent({ onTestSuccess });

  const button = screen.getByRole('button', { name: 'Test connection' });
  await user.click(button);

  await waitFor(() => {
    expect(screen.getByText(/Registry connection successful/)).toBeVisible();
  });

  expect(onTestSuccess).toHaveBeenCalled();
});

test('should show error message on failed test', async () => {
  const user = userEvent.setup();

  // Mock failed response from the API
  server.use(
    http.post('/api/registries/ping', () =>
      HttpResponse.json(
        {
          success: false,
          message: 'Connection failed',
        },
        { status: 200 }
      )
    )
  );

  renderComponent();

  const button = screen.getByRole('button', { name: 'Test connection' });
  await user.click(button);

  await waitFor(() => {
    expect(screen.getByText(/Connection failed/)).toBeVisible();
  });
});

test('should show error message on network error', async () => {
  const restoreConsole = suppressConsoleLogs();

  const user = userEvent.setup();

  // Mock network error
  server.use(http.post('/api/registries/ping', () => HttpResponse.error()));

  renderComponent();

  const button = screen.getByRole('button', { name: 'Test connection' });
  await user.click(button);

  await waitFor(() => {
    expect(
      screen.getByText(/Failed to test registry connection/)
    ).toBeVisible();
  });

  restoreConsole();
});

test('should send correct payload to API', async () => {
  const user = userEvent.setup();
  let receivedPayload: unknown;

  // Mock API to capture the payload
  server.use(
    http.post('/api/registries/ping', async ({ request }) => {
      receivedPayload = await request.json();
      return HttpResponse.json({
        success: true,
        message: 'Registry connection successful',
      });
    })
  );

  renderComponent();

  const button = screen.getByRole('button', { name: 'Test connection' });
  await user.click(button);

  await waitFor(() => {
    expect(screen.getByText(/Registry connection successful/)).toBeVisible();
  });

  expect(receivedPayload).toEqual({
    Username: 'testuser',
    Password: 'testpass',
    Type: 6,
  });
});
