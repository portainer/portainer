import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectedPanel } from './SelectedPanel';

function renderSelectedPanel({
  selected = new Set<string>(),
  removeFile = vi.fn(),
}: {
  selected?: Set<string>;
  removeFile?: (path: string) => void;
} = {}) {
  const user = userEvent.setup();
  render(<SelectedPanel selected={selected} removeFile={removeFile} />);
  return { user, removeFile };
}

describe('SelectedPanel', () => {
  it('calls removeFile with the correct path when the remove button is clicked', async () => {
    const removeFile = vi.fn();
    const { user } = renderSelectedPanel({
      selected: new Set(['src/foo.ts']),
      removeFile,
    });
    await user.click(
      screen.getByRole('button', { name: /remove file \/src\/foo\.ts/i })
    );
    expect(removeFile).toHaveBeenCalledWith('src/foo.ts');
  });

  it('shows "No files selected" when nothing is selected', () => {
    renderSelectedPanel();
    expect(screen.getByText(/no files selected/i)).toBeVisible();
  });

  it('renders all selected file paths', () => {
    renderSelectedPanel({
      selected: new Set(['lib/index.ts', 'src/foo.ts']),
    });
    expect(screen.getByTitle('/lib/index.ts')).toBeVisible();
    expect(screen.getByTitle('/src/foo.ts')).toBeVisible();
  });
});
