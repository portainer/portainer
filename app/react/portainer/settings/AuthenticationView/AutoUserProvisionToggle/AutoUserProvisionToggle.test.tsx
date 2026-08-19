import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { AutoUserProvisionToggle } from './AutoUserProvisionToggle';

describe('AutoUserProvisionToggle', () => {
  test('renders with description', () => {
    render(
      <AutoUserProvisionToggle
        value={false}
        onChange={() => {}}
        description="Test description for automatic user provisioning"
      />
    );

    expect(
      screen.getByText(/test description for automatic user provisioning/i)
    ).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: /automatic user provisioning/i })
    ).toBeVisible();
  });

  test('calls onChange when toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AutoUserProvisionToggle
        value={false}
        onChange={onChange}
        description="Enable automatic user provisioning"
      />
    );

    const toggle = screen.getByRole('checkbox', {
      name: /automatic user provisioning/i,
    });
    await user.click(toggle);

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toBe(true);
  });
});
