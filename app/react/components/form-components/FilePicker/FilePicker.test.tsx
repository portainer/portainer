import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilePicker } from './FilePicker';
import { FileNode } from './types';

const flatFiles: FileNode[] = [
  { name: 'foo.yml' },
  { name: 'bar.ts' },
  { name: 'baz.json' },
];

function renderFilePicker({
  files = flatFiles,
  initialValue = [],
  examplePatterns = ['*.yml', 'src/**'],
}: {
  files?: FileNode[];
  initialValue?: string[];
  examplePatterns?: string[];
} = {}) {
  const user = userEvent.setup();
  const onChange = vi.fn();

  function Wrapper() {
    const [value, setValue] = useState<string[]>(initialValue);
    return (
      <FilePicker
        files={files}
        value={value}
        onChange={(paths) => {
          setValue(paths);
          onChange(paths);
        }}
        exampleExpressions={examplePatterns}
      />
    );
  }

  render(<Wrapper />);
  return { user, onChange };
}

describe('FilePicker', () => {
  it('calls onChange with slash-prefixed sorted paths when files are selected', async () => {
    const { user, onChange } = renderFilePicker({
      files: [{ name: 'foo.yml' }, { name: 'bar.ts' }],
    });
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // foo.yml
    await user.click(checkboxes[1]); // bar.ts
    expect(onChange).toHaveBeenLastCalledWith(['/bar.ts', '/foo.yml']);
  });

  it('sets the search filter when an example pattern button is clicked', async () => {
    const { user } = renderFilePicker({ examplePatterns: ['*.yml'] });
    await user.click(screen.getByRole('button', { name: '*.yml' }));
    expect(screen.getByRole('textbox')).toHaveValue('*.yml');
  });

  it('counts expression-matched files as selected', async () => {
    const { user } = renderFilePicker({
      files: [{ name: 'foo.yml' }, { name: 'bar.ts' }],
    });
    const filterInput = screen.getByRole('textbox');
    await user.click(filterInput);
    await user.type(filterInput, '*.yml');
    await user.keyboard('{Enter}');
    // *.yml matches foo.yml only → 1 selected
    expect(screen.getByText('1 selected')).toBeVisible();
  });

  it('selecting a directory checkbox selects all its descendant files', async () => {
    const { user, onChange } = renderFilePicker({
      files: [{ name: 'src', children: [{ name: 'a.ts' }, { name: 'b.ts' }] }],
    });
    // Only the directory checkbox is visible (not expanded)
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(['/src/a.ts', '/src/b.ts']);
  });

  it('deselects all directory files when a fully-checked directory is clicked again', async () => {
    const { user, onChange } = renderFilePicker({
      files: [{ name: 'src', children: [{ name: 'a.ts' }] }],
    });
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox); // select all
    await user.click(checkbox); // deselect all
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('clears all selected files when Clear is clicked', async () => {
    const { user } = renderFilePicker({
      files: [{ name: 'foo.yml' }],
    });
    const filterInput = screen.getByRole('textbox');
    await user.click(filterInput);
    await user.type(filterInput, '*.yml');
    await user.keyboard('{Enter}');
    expect(screen.getByText('1 selected')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.getByText('0 selected')).toBeVisible();
  });
});
