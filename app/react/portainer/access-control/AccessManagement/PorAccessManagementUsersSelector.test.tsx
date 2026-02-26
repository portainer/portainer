import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { PorAccessManagementUsersSelector } from './PorAccessManagementUsersSelector';

type Option = { Type: 'user' | 'team'; Id: number; Name: string };

function createMockOptions(): Option[] {
  return [
    { Id: 1, Name: 'User One', Type: 'user' },
    { Id: 2, Name: 'Team Alpha', Type: 'team' },
    { Id: 3, Name: 'User Two', Type: 'user' },
  ];
}

describe('PorAccessManagementUsersSelector', () => {
  describe('loading state', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(
        <PorAccessManagementUsersSelector
          options={[]}
          value={[]}
          onChange={vi.fn()}
          isLoading
        />
      );

      // react-select shows a loading indicator when isLoading is true
      const loadingIndicator = document.querySelector(
        '.portainer-selector__loading-indicator'
      );
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should show loading message when menu is opened while loading', async () => {
      const user = userEvent.setup();
      render(
        <PorAccessManagementUsersSelector
          options={[]}
          value={[]}
          onChange={vi.fn()}
          isLoading
        />
      );

      // Click to open the select menu
      const input = screen.getByRole('combobox');
      await user.click(input);

      // The loading message should be visible
      expect(screen.getByText('Loading users and teams...')).toBeVisible();
    });

    it('should not show loading indicator when isLoading is false', () => {
      render(
        <PorAccessManagementUsersSelector
          options={createMockOptions()}
          value={[]}
          onChange={vi.fn()}
          isLoading={false}
        />
      );

      const loadingIndicator = document.querySelector(
        '.portainer-selector__loading-indicator'
      );
      expect(loadingIndicator).not.toBeInTheDocument();
    });
  });

  describe('no options state', () => {
    it('should show default empty text when menu is opened and no options available', async () => {
      const user = userEvent.setup();
      render(
        <PorAccessManagementUsersSelector
          options={[]}
          value={[]}
          onChange={vi.fn()}
          isLoading={false}
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      expect(screen.getByText('No users or teams available.')).toBeVisible();
    });
  });

  describe('label', () => {
    it('should display default label when not provided', () => {
      render(
        <PorAccessManagementUsersSelector
          options={[]}
          value={[]}
          onChange={vi.fn()}
        />
      );

      expect(screen.getByText('Select user(s) and/or team(s)')).toBeVisible();
    });
  });

  describe('placeholder', () => {
    it('should display default placeholder', () => {
      render(
        <PorAccessManagementUsersSelector
          options={createMockOptions()}
          value={[]}
          onChange={vi.fn()}
        />
      );

      expect(
        screen.getByText('Select one or more users and/or teams')
      ).toBeVisible();
    });
  });

  describe('input id', () => {
    it('should have the correct inputId for accessibility', () => {
      render(
        <PorAccessManagementUsersSelector
          options={[]}
          value={[]}
          onChange={vi.fn()}
        />
      );

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('id', 'users-selector');
    });
  });
});
