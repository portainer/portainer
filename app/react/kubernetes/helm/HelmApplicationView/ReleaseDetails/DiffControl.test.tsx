import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { DiffControl, DiffViewMode } from './DiffControl';

// Create a mock for useDebounce that directly passes the setter function
vi.mock('@/react/hooks/useDebounce', () => ({
  useDebounce: (initialValue: number, setter: (value: number) => void) =>
    // Return the initial value and a function that directly calls the setter
    [initialValue, setter],
}));

function renderComponent({
  selectedRevisionNumber = 5,
  latestRevisionNumber = 10,
  compareRevisionNumber = 4,
  setCompareRevisionNumber = vi.fn(),
  earliestRevisionNumber = 1,
  diffViewMode = 'view' as DiffViewMode,
  setDiffViewMode = vi.fn(),
  isUserSupplied = false,
  setIsUserSupplied = vi.fn(),
  showUserSuppliedCheckbox = false,
} = {}) {
  return render(
    <DiffControl
      selectedRevisionNumber={selectedRevisionNumber}
      latestRevisionNumber={latestRevisionNumber}
      compareRevisionNumber={compareRevisionNumber}
      setCompareRevisionNumber={setCompareRevisionNumber}
      earliestRevisionNumber={earliestRevisionNumber}
      diffViewMode={diffViewMode}
      setDiffViewMode={setDiffViewMode}
      isUserSupplied={isUserSupplied}
      setIsUserSupplied={setIsUserSupplied}
      showUserSuppliedCheckbox={showUserSuppliedCheckbox}
    />
  );
}

describe('DiffControl', () => {
  it('should only render the user supplied checkbox when latestRevisionNumber is 1 and showUserSuppliedCheckbox is true', () => {
    const { queryByLabelText } = renderComponent({
      latestRevisionNumber: 1,
      showUserSuppliedCheckbox: true,
      setIsUserSupplied: vi.fn(),
    });
    expect(queryByLabelText('View')).toBeNull();
    expect(queryByLabelText('Diff with previous')).toBeNull();
    expect(queryByLabelText('Diff with specific revision:')).toBeNull();
    expect(queryByLabelText('User defined only')).toBeInTheDocument();
  });

  it('should not render any controls when latestRevisionNumber is 1 and showUserSuppliedCheckbox is false', () => {
    const { queryByLabelText } = renderComponent({
      latestRevisionNumber: 1,
      showUserSuppliedCheckbox: false,
    });
    expect(queryByLabelText('Diff with previous')).toBeNull();
    expect(queryByLabelText('Diff with specific revision:')).toBeNull();
    expect(queryByLabelText('View')).toBeNull();
    expect(queryByLabelText('User defined only')).toBeNull();
  });

  it('should render view option', () => {
    const { getByLabelText } = renderComponent();
    expect(getByLabelText('View')).toBeInTheDocument();
  });

  it('should render "Diff with previous" option when earliestRevisionNumber < selectedRevisionNumber', () => {
    const { getByLabelText } = renderComponent({
      earliestRevisionNumber: 3,
      selectedRevisionNumber: 5,
    });
    expect(getByLabelText('Diff with previous')).toBeInTheDocument();
  });

  it('should render "Diff with previous" option as disabled when earliestRevisionNumber >= selectedRevisionNumber', () => {
    const { getByLabelText } = renderComponent({
      earliestRevisionNumber: 5,
      selectedRevisionNumber: 5,
    });

    expect(getByLabelText('View')).toBeInTheDocument();
    expect(getByLabelText('Diff with specific revision:')).toBeInTheDocument();
    // 'Diff with previous' should exist and be disabled
    const diffWithPreviousOption = getByLabelText('Diff with previous');
    expect(diffWithPreviousOption).toBeInTheDocument();
    expect(diffWithPreviousOption).toBeDisabled();
  });

  it('should render "Diff with specific revision" option', () => {
    const { getByLabelText } = renderComponent();
    expect(getByLabelText('Diff with specific revision:')).toBeInTheDocument();
  });

  it('should render user supplied checkbox when showUserSuppliedCheckbox is true', () => {
    const { getByLabelText } = renderComponent({
      showUserSuppliedCheckbox: true,
    });
    expect(getByLabelText('User defined only')).toBeInTheDocument();
  });

  it('should not render user supplied checkbox when showUserSuppliedCheckbox is false', () => {
    const { queryByLabelText } = renderComponent({
      showUserSuppliedCheckbox: false,
    });
    expect(queryByLabelText('User defined only')).not.toBeInTheDocument();
  });

  it('should call setDiffViewMode when a radio option is selected', async () => {
    const user = userEvent.setup();
    const setDiffViewMode = vi.fn();

    const { getByLabelText } = renderComponent({
      setDiffViewMode,
      diffViewMode: 'view',
    });

    await user.click(getByLabelText('Diff with specific revision:'));
    expect(setDiffViewMode).toHaveBeenCalledWith('specific');
  });

  it('should call setIsUserSupplied when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const setIsUserSupplied = vi.fn();

    const { getByLabelText } = renderComponent({
      setIsUserSupplied,
      isUserSupplied: false,
      showUserSuppliedCheckbox: true,
    });

    await user.click(getByLabelText('User defined only'));
    expect(setIsUserSupplied).toHaveBeenCalledWith(true);
  });
});

describe('DiffWithSpecificRevision', () => {
  it('should display input with compareRevisionNumber value when not NaN', () => {
    const compareRevisionNumber = 3;
    const { getByRole } = renderComponent({
      diffViewMode: 'specific',
      compareRevisionNumber,
    });

    const input = getByRole('spinbutton');
    expect(input).toHaveValue(compareRevisionNumber);
  });

  it('should handle input values and constraints properly', () => {
    const setCompareRevisionNumber = vi.fn();
    const earliestRevisionNumber = 2;
    const latestRevisionNumber = 10;

    const { getByRole } = renderComponent({
      diffViewMode: 'specific',
      earliestRevisionNumber,
      latestRevisionNumber,
      setCompareRevisionNumber,
      compareRevisionNumber: 4,
    });

    // Check that input has the right min/max attributes
    const input = getByRole('spinbutton');
    expect(input).toHaveAttribute('min', earliestRevisionNumber.toString());
    expect(input).toHaveAttribute('max', latestRevisionNumber.toString());

    fireEvent.change(input, { target: { valueAsNumber: 11 } });
    expect(setCompareRevisionNumber).toHaveBeenLastCalledWith(
      latestRevisionNumber
    );

    fireEvent.change(input, { target: { valueAsNumber: 1 } });
    expect(setCompareRevisionNumber).toHaveBeenLastCalledWith(
      earliestRevisionNumber
    );

    fireEvent.change(input, { target: { valueAsNumber: 5 } });
    expect(setCompareRevisionNumber).toHaveBeenLastCalledWith(5);
  });

  it('should handle NaN values in the input as empty string', () => {
    const { getByRole } = renderComponent({
      diffViewMode: 'specific',
      compareRevisionNumber: NaN,
    });

    const input = getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
