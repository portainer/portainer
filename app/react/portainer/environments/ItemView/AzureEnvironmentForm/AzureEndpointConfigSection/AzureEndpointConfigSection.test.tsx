import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { AzureEndpointConfigSection } from './AzureEndpointConfigSection';

describe('AzureEndpointConfigSection', () => {
  it('should render with initial values', () => {
    const values = {
      applicationId: 'app-id-123',
      tenantId: 'tenant-id-456',
      authenticationKey: 'auth-key-789',
    };
    const setValues = vi.fn();

    render(
      <AzureEndpointConfigSection values={values} setValues={setValues} />
    );

    expect(screen.getByLabelText('Application ID')).toHaveValue('app-id-123');
    expect(screen.getByLabelText('Tenant ID')).toHaveValue('tenant-id-456');
    expect(screen.getByLabelText('Authentication key')).toHaveValue(
      'auth-key-789'
    );
    expect(screen.getByText('Azure configuration')).toBeVisible();
  });

  it('should call setValues when input values change', async () => {
    const values = {
      applicationId: '',
      tenantId: '',
      authenticationKey: '',
    };
    const setValues = vi.fn();

    render(
      <AzureEndpointConfigSection values={values} setValues={setValues} />
    );

    const user = userEvent.setup();

    // Type in Application ID (userEvent.type triggers onChange for each character)
    const appIdInput = screen.getByLabelText('Application ID');
    await user.clear(appIdInput);
    await user.type(appIdInput, 'a');
    expect(setValues).toHaveBeenLastCalledWith({
      applicationId: 'a',
      tenantId: '',
      authenticationKey: '',
    });

    // Reset mock and test Tenant ID
    setValues.mockClear();
    const tenantIdInput = screen.getByLabelText('Tenant ID');
    await user.clear(tenantIdInput);
    await user.type(tenantIdInput, 't');
    expect(setValues).toHaveBeenLastCalledWith({
      applicationId: '',
      tenantId: 't',
      authenticationKey: '',
    });

    // Reset mock and test Authentication key
    setValues.mockClear();
    const authKeyInput = screen.getByLabelText('Authentication key');
    await user.clear(authKeyInput);
    await user.type(authKeyInput, 'k');
    expect(setValues).toHaveBeenLastCalledWith({
      applicationId: '',
      tenantId: '',
      authenticationKey: 'k',
    });
  });
});
