import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { withTestRouter } from '@/react/test-utils/withRouter';

import { EnvironmentFormActions } from './EnvironmentFormActions';

describe('EnvironmentFormActions', () => {
  it('should render update and cancel buttons', async () => {
    renderComponent({ isLoading: false });

    expect(
      await screen.findByRole('button', { name: 'Update environment' })
    ).toBeVisible();
    expect(screen.getByText('Cancel')).toBeVisible();
  });

  it('should disable update button when form is not dirty', () => {
    renderComponent({ isDirty: false });

    const updateButton = screen.getByRole('button', {
      name: 'Update environment',
    });
    expect(updateButton).toBeDisabled();
  });

  it('should disable update button when form is invalid', () => {
    renderComponent({ isValid: false, isDirty: true });

    const updateButton = screen.getByRole('button', {
      name: 'Update environment',
    });
    expect(updateButton).toBeDisabled();
  });

  it('should enable update button when form is valid and dirty', () => {
    renderComponent({ isValid: true, isDirty: true });

    const updateButton = screen.getByRole('button', {
      name: 'Update environment',
    });
    expect(updateButton).toBeEnabled();
  });

  it('should disable submit button when loading', () => {
    renderComponent({ isLoading: true });

    const updateButton = screen.getByText('Updating environment...');

    expect(updateButton).toBeDisabled();
  });
});

function renderComponent(
  props?: Partial<React.ComponentProps<typeof EnvironmentFormActions>>
) {
  const defaultProps: React.ComponentProps<typeof EnvironmentFormActions> = {
    isLoading: false,
    isValid: true,
    isDirty: false,
  };

  const Wrapper = withTestRouter(EnvironmentFormActions);

  return render(<Wrapper {...defaultProps} {...props} />);
}
