import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse } from 'msw';
import { describe, expect, test } from 'vitest';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { LDAPSettings } from '../../../types';

import { LdapSettingsTestLogin } from './LdapSettingsTestLogin';

const mockSettings = {
  AnonymousMode: false,
  ReaderDN: '',
  URL: 'ldap://localhost',
  TLSConfig: {
    TLS: false,
    TLSSkipVerify: false,
  },
  StartTLS: false,
  SearchSettings: [],
  GroupSearchSettings: [],
  AutoCreateUsers: false,
} satisfies LDAPSettings;

function renderComponent() {
  const Wrapped = withTestQueryProvider(LdapSettingsTestLogin);
  return render(<Wrapped settings={mockSettings} />);
}

describe('LdapSettingsTestLogin', () => {
  test('renders username and password inputs and test button', () => {
    renderComponent();

    expect(screen.getByLabelText(/username/i)).toBeVisible();
    expect(screen.getByLabelText(/password/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /^test$/i })).toBeVisible();
  });

  test('button is disabled when inputs are empty, enabled after filling both fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    const button = screen.getByRole('button', { name: /^test$/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/password/i), 'testpass');
    expect(button).toBeEnabled();
  });

  test('sends correct payload to API when test button is clicked', async () => {
    const user = userEvent.setup();
    let receivedPayload: unknown;

    server.use(
      http.post('/api/ldap/test', async ({ request }) => {
        receivedPayload = await request.json();
        return HttpResponse.json({ valid: true });
      })
    );

    renderComponent();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'testpass');
    await user.click(screen.getByRole('button', { name: /^test$/i }));

    await waitFor(() => {
      expect(receivedPayload).toMatchObject({
        LDAPSettings: mockSettings,
        Username: 'testuser',
        Password: 'testpass',
      });
    });
  });
});
