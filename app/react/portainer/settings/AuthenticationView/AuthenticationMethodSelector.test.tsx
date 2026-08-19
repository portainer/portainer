import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthenticationMethodSelector } from './AuthenticationMethodSelector';

// Helper render function with default props
function renderComponent(props: {
  value: number;
  onChange?: (value: number) => void;
  radioName?: string;
}) {
  const defaultProps = {
    onChange: vi.fn(),
    ...props,
  };

  return render(<AuthenticationMethodSelector {...defaultProps} />);
}

describe('AuthenticationMethodSelector', () => {
  it('should render all authentication method options', () => {
    renderComponent({ value: 1 });

    // Verify all authentication methods are rendered
    expect(screen.getByLabelText('Internal', { exact: false })).toBeVisible();
    expect(screen.getByLabelText('LDAP', { exact: false })).toBeVisible();
    expect(
      screen.getByLabelText('Microsoft Active Directory', { exact: false })
    ).toBeVisible();
    expect(screen.getByLabelText('OAuth', { exact: false })).toBeVisible();
  });

  it('should select the Internal authentication method by default', () => {
    renderComponent({ value: 1 });

    const internalRadio = screen.getByLabelText('Internal', {
      exact: false,
    }) as HTMLInputElement;
    expect(internalRadio.checked).toBe(true);
  });

  it('should select the LDAP authentication method when value is 2', () => {
    renderComponent({ value: 2 });

    const ldapRadio = screen.getByLabelText('LDAP', {
      exact: false,
    }) as HTMLInputElement;
    expect(ldapRadio.checked).toBe(true);
  });

  it('should call onChange when selecting a different authentication method', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: 1, onChange });

    // Click on LDAP option
    const ldapRadio = screen.getByLabelText('LDAP', { exact: false });
    await user.click(ldapRadio);

    // Verify onChange was called with LDAP value (2)
    expect(onChange).toHaveBeenCalledWith(2, false);
  });

  it('should not call onChange when clicking the already selected option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderComponent({ value: 1, onChange });

    // Click on already selected Internal option
    const internalRadio = screen.getByLabelText('Internal', { exact: false });
    await user.click(internalRadio);

    // onChange should not be called for already selected option
    expect(onChange).not.toHaveBeenCalled();
  });
});
