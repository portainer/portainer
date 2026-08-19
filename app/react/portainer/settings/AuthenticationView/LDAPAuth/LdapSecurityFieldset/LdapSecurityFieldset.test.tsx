import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { LdapSecurityFieldset } from './LdapSecurityFieldset';

describe('LdapSecurityFieldset', () => {
  test('shows StartTLS toggle when TLS is disabled, hides it when TLS is enabled', () => {
    const { rerender } = render(
      <LdapSecurityFieldset
        values={{ startTLS: false, tls: false, tlsSkipVerify: false }}
        onChange={() => {}}
      />
    );

    expect(
      screen.getByRole('checkbox', { name: /use starttls/i })
    ).toBeVisible();

    rerender(
      <LdapSecurityFieldset
        values={{ startTLS: false, tls: true, tlsSkipVerify: false }}
        onChange={() => {}}
      />
    );

    expect(
      screen.queryByRole('checkbox', { name: /use starttls/i })
    ).toBeNull();
  });

  test('shows TLS toggle when StartTLS is disabled, calls onChange with tls: true on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LdapSecurityFieldset
        values={{ startTLS: false, tls: false, tlsSkipVerify: false }}
        onChange={onChange}
      />
    );

    const tlsToggle = screen.getByRole('checkbox', { name: /use tls/i });
    expect(tlsToggle).toBeVisible();

    await user.click(tlsToggle);

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toEqual({ tls: true });
  });

  describe('CA certificate visibility', () => {
    test('shows CA cert upload when TLS is enabled', () => {
      render(
        <LdapSecurityFieldset
          values={{ startTLS: false, tls: true, tlsSkipVerify: false }}
          onChange={() => {}}
        />
      );
      expect(screen.getByText('TLS CA certificate')).toBeVisible();
    });

    test('shows CA cert upload when TLS is enabled regardless of tlsSkipVerify', () => {
      render(
        <LdapSecurityFieldset
          values={{ startTLS: false, tls: true, tlsSkipVerify: true }}
          onChange={() => {}}
        />
      );
      expect(screen.getByText('TLS CA certificate')).toBeVisible();
    });

    test('shows CA cert upload when StartTLS is enabled and tlsSkipVerify is false', () => {
      render(
        <LdapSecurityFieldset
          values={{ startTLS: true, tls: false, tlsSkipVerify: false }}
          onChange={() => {}}
        />
      );
      expect(screen.getByText('TLS CA certificate')).toBeVisible();
    });

    test('hides CA cert upload when StartTLS is enabled but tlsSkipVerify is true', () => {
      render(
        <LdapSecurityFieldset
          values={{ startTLS: true, tls: false, tlsSkipVerify: true }}
          onChange={() => {}}
        />
      );
      expect(screen.queryByText('TLS CA certificate')).toBeNull();
    });

    test('hides CA cert upload when neither TLS nor StartTLS is enabled', () => {
      render(
        <LdapSecurityFieldset
          values={{ startTLS: false, tls: false, tlsSkipVerify: false }}
          onChange={() => {}}
        />
      );
      expect(screen.queryByText('TLS CA certificate')).toBeNull();
    });
  });
});
