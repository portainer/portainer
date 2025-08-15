import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import selectEvent from '@/react/test-utils/react-select';

import { Select } from './ReactSelect';

describe('ReactSelect', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const mockGroupedOptions = [
    {
      label: 'Group 1',
      options: [
        { value: 'g1-option1', label: 'Group 1 Option 1' },
        { value: 'g1-option2', label: 'Group 1 Option 2' },
      ],
    },
    {
      label: 'Group 2',
      options: [
        { value: 'g2-option1', label: 'Group 2 Option 1' },
        { value: 'g2-option2', label: 'Group 2 Option 2' },
      ],
    },
  ];

  describe('Select component', () => {
    it('should apply the correct size class', () => {
      const { container } = render(
        <Select
          id="test-select"
          options={mockOptions}
          size="sm"
          data-cy="test-select"
        />
      );

      const selectContainer = container.querySelector(
        '.portainer-selector-root'
      );
      expect(selectContainer).toHaveClass('sm');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Select
          id="test-select"
          options={mockOptions}
          className="custom-class"
          data-cy="test-select"
        />
      );

      const selectContainer = container.querySelector(
        '.portainer-selector-root'
      );
      expect(selectContainer).toHaveClass('custom-class');
    });

    it('should handle onChange event', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Select
          id="test-select"
          options={mockOptions}
          onChange={handleChange}
          data-cy="test-select"
          inputId="test-input"
        />
      );

      const input = screen.getByRole('combobox');
      await selectEvent.select(input, 'Option 2', { user });

      expect(handleChange).toHaveBeenCalledWith(
        mockOptions[1],
        expect.objectContaining({ action: 'select-option' })
      );
    });

    it('should handle multi-select', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Select
          id="test-select"
          options={mockOptions}
          onChange={handleChange}
          isMulti
          data-cy="test-select"
          inputId="test-input"
        />
      );

      const input = screen.getByRole('combobox');
      await selectEvent.select(input, 'Option 1', { user });
      await selectEvent.select(input, 'Option 2', { user });

      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange).toHaveBeenLastCalledWith(
        [mockOptions[0], mockOptions[1]],
        expect.objectContaining({ action: 'select-option' })
      );
    });

    it('should render with grouped options', async () => {
      const user = userEvent.setup();

      render(
        <Select
          id="test-select"
          options={mockGroupedOptions}
          data-cy="test-select"
          inputId="test-input"
        />
      );

      const input = screen.getByRole('combobox');
      await selectEvent.openMenu(input, { user });

      expect(screen.getByText('Group 1')).toBeInTheDocument();
      expect(screen.getByText('Group 2')).toBeInTheDocument();
      expect(screen.getByText('Group 1 Option 1')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      const { container } = render(
        <Select
          id="test-select"
          options={mockOptions}
          isDisabled
          data-cy="test-select"
        />
      );

      const selectContainer = container.querySelector(
        '.portainer-selector-root'
      );
      expect(selectContainer).toHaveClass('portainer-selector--is-disabled');
    });

    it('should handle loading state', () => {
      const { container } = render(
        <Select
          id="test-select"
          options={mockOptions}
          isLoading
          data-cy="test-select"
        />
      );

      const loadingIndicator = container.querySelector(
        '.portainer-selector__loading-indicator'
      );
      expect(loadingIndicator).toBeInTheDocument();
    });

    it('should clear selection', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Select
          id="test-select"
          options={mockOptions}
          onChange={handleChange}
          isClearable
          value={mockOptions[0]}
          data-cy="test-select"
          inputId="test-input"
        />
      );

      const input = screen.getByRole('combobox');
      await selectEvent.clearFirst(input, { user });

      expect(handleChange).toHaveBeenCalledWith(
        null,
        expect.objectContaining({ action: 'clear' })
      );
    });

    it('should handle empty options array', () => {
      render(<Select id="test-select" options={[]} data-cy="test-select" />);

      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
    });

    it('should handle undefined options', () => {
      render(
        <Select id="test-select" options={undefined} data-cy="test-select" />
      );

      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Component integration', () => {
    it('should switch between regular and paginated select based on options count', async () => {
      const user = userEvent.setup();

      // First render with few options - should use regular Select
      const { rerender } = render(
        <Select
          id="test-select"
          options={mockOptions}
          data-cy="test-select"
          inputId="test-input"
        />
      );

      let input = screen.getByRole('combobox');
      await user.click(input);

      // Regular select should render all 3 options immediately
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();

      // Close menu
      await user.keyboard('{Escape}');

      // Now rerender with many options - should switch to TooManyResultsSelector
      const manyOptions = Array.from({ length: 1001 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      rerender(
        <Select
          id="test-select"
          options={manyOptions}
          data-cy="test-select"
          inputId="test-input"
        />
      );

      input = screen.getByRole('combobox');
      await user.click(input);

      // Paginated select should only render first page (100 items max)
      // Check that first few options are present
      await waitFor(() => {
        expect(screen.getByText('Option 0')).toBeInTheDocument();
      });

      // Count total rendered options - should be limited to PAGE_SIZE (100)
      // React-select uses divs with class portainer-selector__option for options
      const renderedOptions = document.querySelectorAll(
        '.portainer-selector__option'
      );
      expect(renderedOptions.length).toBeLessThanOrEqual(100);
      expect(renderedOptions.length).toBeGreaterThan(0);

      // Verify that options beyond page size are NOT rendered
      expect(screen.queryByText('Option 999')).not.toBeInTheDocument();
    });

    it('should render creatable mode when isCreatable prop is true', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Select
          id="test-select"
          options={mockOptions}
          isCreatable
          onChange={handleChange}
          data-cy="test-select"
          inputId="test-input"
        />
      );

      const input = screen.getByRole('combobox');
      // Type a new value that doesn't exist in options
      await user.type(input, 'Brand New Option');

      // Should show create option (may appear in multiple places)
      await waitFor(() => {
        const createOptions = screen.getAllByText(/Create "Brand New Option"/);
        expect(createOptions.length).toBeGreaterThan(0);
      });
    });

    it('should preserve props when switching to TooManyResultsSelector', () => {
      const handleChange = vi.fn();
      const manyOptions = Array.from({ length: 1001 }, (_, i) => ({
        value: `option${i}`,
        label: `Option ${i}`,
      }));

      const { container } = render(
        <Select
          id="test-select"
          options={manyOptions}
          onChange={handleChange}
          placeholder="Select an option"
          isSearchable
          isClearable
          data-cy="test-select"
          inputId="test-input"
        />
      );

      // Should use TooManyResultsSelector for large datasets
      const selectContainer = container.querySelector(
        '.portainer-selector-root'
      );
      expect(selectContainer).toBeInTheDocument();

      // Should preserve data-cy attribute
      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('data-cy', 'test-select');

      // Should preserve id
      expect(input).toHaveAttribute('id', 'test-input');
    });
  });
});
