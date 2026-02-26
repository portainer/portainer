import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { RemoveAccessButton } from './RemoveAccessButton';
import { Access } from './types';

function createMockAccess(overrides: Partial<Access> = {}): Access {
  return {
    Id: 1,
    Name: 'Test User',
    Type: 'user',
    Role: { Id: 1, Name: 'Admin' },
    ...overrides,
  } as Access;
}

describe('RemoveAccessButton', () => {
  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      const mockAccess = createMockAccess();
      render(
        <RemoveAccessButton onClick={vi.fn()} items={[mockAccess]} isLoading />
      );

      // DeleteButton shows loading text when isLoading is true
      expect(screen.getByText('Removing...')).toBeVisible();
    });

    it('should show "Remove" text when isLoading is false', () => {
      const mockAccess = createMockAccess();
      render(
        <RemoveAccessButton
          onClick={vi.fn()}
          items={[mockAccess]}
          isLoading={false}
        />
      );

      expect(screen.getByText('Remove')).toBeVisible();
      expect(screen.queryByText('Removing...')).not.toBeInTheDocument();
    });

    it('should show "Remove" text when isLoading is undefined', () => {
      const mockAccess = createMockAccess();
      render(<RemoveAccessButton onClick={vi.fn()} items={[mockAccess]} />);

      expect(screen.getByText('Remove')).toBeVisible();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when items array is empty', () => {
      render(
        <RemoveAccessButton onClick={vi.fn()} items={[]} isLoading={false} />
      );

      const button = screen.getByRole('button', { name: /remove/i });
      expect(button).toBeDisabled();
    });

    it('should be enabled when items array has elements', () => {
      const mockAccess = createMockAccess();
      render(
        <RemoveAccessButton
          onClick={vi.fn()}
          items={[mockAccess]}
          isLoading={false}
        />
      );

      const button = screen.getByRole('button', { name: /remove/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('click behavior', () => {
    it('should open confirmation dialog when clicked', async () => {
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      const mockAccess = createMockAccess();

      render(
        <RemoveAccessButton
          onClick={mockOnClick}
          items={[mockAccess]}
          isLoading={false}
        />
      );

      const button = screen.getByRole('button', { name: /remove/i });
      await user.click(button);

      // The confirm dialog should appear
      expect(
        screen.getByText(/are you sure you want to unauthorized/i)
      ).toBeVisible();
    });
  });
});
