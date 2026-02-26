import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { AccessDatatable } from './AccessDatatable';
import { Access } from './types';

vi.mock('@/react/portainer/feature-flags/feature-flags.service', () => ({
  isBE: true,
}));

function createMockAccess(overrides: Partial<Access> = {}): Access {
  return {
    Id: 1,
    Name: 'Test User',
    Type: 'user',
    Role: { Id: 1, Name: 'Admin' },
    ...overrides,
  } as Access;
}

function renderComponent(
  props: Partial<Parameters<typeof AccessDatatable>[0]> = {}
) {
  const defaultProps = {
    tableKey: 'test-access-table',
    dataset: [],
    onRemove: vi.fn(),
    isUpdatingAccess: false,
    isLoading: false,
    onUpdate: vi.fn(),
  };

  const Wrapped = withTestQueryProvider(withTestRouter(AccessDatatable));
  return render(<Wrapped {...defaultProps} {...props} />);
}

describe('AccessDatatable', () => {
  describe('loading state', () => {
    it('should show loading state when isLoading is true', () => {
      renderComponent({
        isLoading: true,
        dataset: [],
      });

      expect(screen.getByLabelText('Access')).toBeVisible();
      // Datatable shows loading indicator when isLoading is true
      expect(screen.getByText('Loading...')).toBeVisible();
    });

    it('should not show loading state when isLoading is false', () => {
      renderComponent({
        isLoading: false,
        dataset: [createMockAccess()],
      });

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('content display', () => {
    it('should display access data in the table', () => {
      const mockAccess = createMockAccess({ Name: 'John Doe' });
      renderComponent({
        isLoading: false,
        dataset: [mockAccess],
      });

      expect(screen.getByText('John Doe')).toBeVisible();
    });

    it('should display empty state when dataset is empty and not loading', () => {
      renderComponent({
        isLoading: false,
        dataset: [],
      });

      expect(screen.getByText('No items available.')).toBeVisible();
    });

    it('should render the datatable title', () => {
      renderComponent({
        isLoading: false,
        dataset: [],
      });

      expect(screen.getByText('Access')).toBeVisible();
    });
  });

  describe('inherited access', () => {
    it('should show inherited access warning when inheritFrom is true', () => {
      renderComponent({
        isLoading: false,
        dataset: [],
        inheritFrom: true,
      });

      // Multiple "Access tagged as" divs are rendered (one for inherited, one for override)
      const elements = screen.getAllByText(/Access tagged as/);
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeVisible();
    });
  });

  describe('update functionality', () => {
    it('should render update button when isUpdateEnabled is true', () => {
      const mockAccess = createMockAccess();
      renderComponent({
        isLoading: false,
        isUpdateEnabled: true,
        showRoles: true,
        dataset: [mockAccess],
      });

      const updateButton = screen.getByRole('button', { name: /update/i });
      expect(updateButton).toBeVisible();
    });

    it('should disable update button when no roles are changed', () => {
      const mockAccess = createMockAccess();
      renderComponent({
        isLoading: false,
        isUpdateEnabled: true,
        showRoles: true,
        dataset: [mockAccess],
      });

      const updateButton = screen.getByRole('button', { name: /update/i });
      expect(updateButton).toBeDisabled();
    });

    it('should show "Updating..." text when isUpdatingAccess is true', () => {
      const mockAccess = createMockAccess();
      renderComponent({
        isLoading: false,
        isUpdatingAccess: true,
        isUpdateEnabled: true,
        showRoles: true,
        dataset: [mockAccess],
      });

      expect(screen.getByText('Updating...')).toBeVisible();
    });

    it('should show warning text when showWarning and isUpdateEnabled are true', () => {
      const mockAccess = createMockAccess();
      renderComponent({
        isLoading: false,
        isUpdateEnabled: true,
        showWarning: true,
        dataset: [mockAccess],
      });

      expect(screen.getByText(/logout and login/i)).toBeVisible();
    });
  });
});
