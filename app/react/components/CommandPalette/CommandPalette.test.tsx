import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CommandPalette } from './CommandPalette';

const allFilePaths = ['foo.yml', 'bar.yml', 'baz.ts'];

function renderSearchBar({
  value = '',
  onChange = vi.fn(),
  addExpression = vi.fn(),
  filePaths = allFilePaths,
  renderDropdown,
}: {
  value?: string;
  onChange?: (value: string) => void;
  addExpression?: (pattern: string) => void;
  filePaths?: string[];
  renderDropdown?: (paths: string[]) => ReactNode;
} = {}) {
  const user = userEvent.setup();
  render(
    <CommandPalette
      value={value}
      onChange={onChange}
      onCompletion={addExpression}
      allFilePaths={filePaths}
      renderDropdown={renderDropdown}
    />
  );
  return { user, onChange, addExpression };
}

describe('CommandPalette', () => {
  it('shows a live match count when the filter is active', async () => {
    // *.yml matches foo.yml and bar.yml → 2 matches
    const { user } = renderSearchBar({ value: '*.yml' });
    const inputElement = screen.getByTestId('command-palette-search-input');
    await user.click(inputElement);
    expect(screen.getByText(/2 matches/)).toBeVisible();
  });

  it('shows singular "match" for exactly one result', async () => {
    // *.ts matches only baz.ts → 1 match
    const { user } = renderSearchBar({ value: '*.ts' });
    const inputElement = screen.getByTestId('command-palette-search-input');
    await user.click(inputElement);
    expect(screen.getByText(/1 match/)).toBeVisible();
  });

  it('calls addExpression with the glob pattern unchanged when Enter is pressed', async () => {
    const addExpression = vi.fn();
    const onChange = vi.fn();
    const { user } = renderSearchBar({
      value: '*.yml',
      addExpression,
      onChange,
    });
    const inputElement = screen.getByTestId('command-palette-search-input');
    await user.click(inputElement);
    await user.keyboard('{Enter}');
    expect(addExpression).toHaveBeenCalledWith('*.yml');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('wraps plain text in wildcards when added as an expression', async () => {
    const addExpression = vi.fn();
    const { user } = renderSearchBar({ value: 'foo', addExpression });
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Enter}');
    expect(addExpression).toHaveBeenCalledWith('*foo*');
  });

  it('does not call addExpression when Enter is pressed with an empty filter', async () => {
    const addExpression = vi.fn();
    const { user } = renderSearchBar({ value: '', addExpression });
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Enter}');
    expect(addExpression).not.toHaveBeenCalled();
  });

  it('clears the filter when Escape is pressed', async () => {
    const onChange = vi.fn();
    const { user } = renderSearchBar({ value: 'some text', onChange });
    await user.click(screen.getByRole('textbox'));
    await user.keyboard('{Escape}');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('clears the filter when the clear (X) button is clicked', async () => {
    const onChange = vi.fn();
    const { user } = renderSearchBar({ value: 'test', onChange });
    await user.click(screen.getByRole('button', { name: /clear search/i }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls addExpression when the Add expression button is clicked', async () => {
    const addExpression = vi.fn();
    const onChange = vi.fn();
    const { user } = renderSearchBar({
      value: 'src/**',
      addExpression,
      onChange,
    });
    await user.click(screen.getByRole('button', { name: /add expression/i }));
    expect(addExpression).toHaveBeenCalledWith('src/**');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('calls onChange when typing in the input', async () => {
    const onChange = vi.fn();
    const { user } = renderSearchBar({ onChange });
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalled();
  });

  it('shows matching file paths in the dropdown when the filter is active', async () => {
    const { user } = renderSearchBar({ value: '*.yml' });
    const inputElement = screen.getByTestId('command-palette-search-input');
    await user.click(inputElement);
    expect(screen.getByText('/foo.yml')).toBeVisible();
    expect(screen.getByText('/bar.yml')).toBeVisible();
    expect(screen.queryByText('/baz.ts')).not.toBeInTheDocument();
  });

  it('does not show the dropdown when the filter is empty', () => {
    renderSearchBar({ value: '' });
    expect(screen.queryByText('/foo.yml')).not.toBeInTheDocument();
  });

  it('calls renderDropdown with matching paths instead of rendering the default dropdown', async () => {
    const renderDropdown = vi.fn(() => null);
    const { user } = renderSearchBar({ value: '*.yml', renderDropdown });
    const inputElement = screen.getByTestId('command-palette-search-input');
    await user.click(inputElement);
    expect(renderDropdown).toHaveBeenCalledWith(['foo.yml', 'bar.yml']);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('does not call renderDropdown when the filter is empty', () => {
    const renderDropdown = vi.fn(() => null);
    renderSearchBar({ value: '', renderDropdown });
    expect(renderDropdown).not.toHaveBeenCalled();
  });
});
