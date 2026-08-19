import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { SortByGroup, SortOption } from './SortByGroup';

vi.mock('@reach/menu-button');

const sortOptions: SortOption[] = [
  { key: 'Group', label: 'Group', grouped: true },
  { key: 'Platform', label: 'Platform', grouped: true },
  { key: 'Name', label: 'Name' },
];

const groupOptions = {
  Group: [
    { key: 'GroupA', label: 'GroupA' },
    { key: 'GroupB', label: 'GroupB' },
  ],
  Platform: [
    { key: 'Docker', label: 'Docker' },
    { key: 'Kubernetes', label: 'Kubernetes' },
  ],
};

function renderComponent({
  group = 'Group' as string,
  groupValue = null as string | null,
  onChange = vi.fn(),
} = {}) {
  const Wrapped = withTestQueryProvider(
    withTestRouter(() => (
      <SortByGroup
        value={{ group, groupValue }}
        onChange={onChange}
        sortOptions={sortOptions}
        groupOptions={groupOptions}
        sortDesc={false}
        dataCy="test"
      />
    ))
  );
  return { ...render(<Wrapped />), onChange };
}

describe('SortByGroup', () => {
  describe('grouped: false option', () => {
    test('clicking an inactive button calls onChange with { group, groupValue: null }', async () => {
      const user = userEvent.setup();
      const { onChange } = renderComponent({ group: 'Group' });

      await user.click(screen.getByRole('button', { name: /^Name$/i }));

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        group: 'Name',
        groupValue: null,
      });
    });

    test('clicking the already-active button does calls onChange', async () => {
      const user = userEvent.setup();
      const { onChange } = renderComponent({ group: 'Name' });

      await user.click(screen.getByRole('button', { name: /^Name Asc/i }));

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        group: 'Name',
        groupValue: null,
      });
    });
  });

  describe('grouped: true option', () => {
    test('clicking the dropdown button to open it does not call onChange', async () => {
      const user = userEvent.setup();
      const { onChange } = renderComponent({ group: 'Group' });

      await user.click(screen.getByRole('button', { name: /^Platform$/i }));

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('menu')).toBeVisible();
    });

    test('selecting a filter from an inactive grouped option calls onChange with both keys', async () => {
      const user = userEvent.setup();
      const { onChange } = renderComponent({ group: 'Group' });

      await user.click(screen.getByRole('button', { name: /^Platform$/i }));
      await user.click(screen.getByRole('menuitem', { name: /Docker/ }));

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        group: 'Platform',
        groupValue: 'Docker',
      });
    });

    test('selecting a filter from the already-active grouped option calls onChange', async () => {
      const user = userEvent.setup();
      const { onChange } = renderComponent({
        group: 'Group',
        groupValue: null,
      });

      await user.click(screen.getByRole('button', { name: /^Group$/i }));
      await user.click(screen.getByRole('menuitem', { name: /GroupA/ }));

      expect(onChange).toHaveBeenCalledExactlyOnceWith({
        group: 'Group',
        groupValue: 'GroupA',
      });
    });

    test('selecting All from a grouped dropdown calls onChange with (key, null)', async () => {
      const user = userEvent.setup();
      const { onChange } = renderComponent({
        group: 'Group',
        groupValue: 'GroupA',
      });

      await user.click(screen.getByRole('button', { name: /^Group/i }));
      await user.click(screen.getByRole('menuitem', { name: /^All$/ }));

      expect(onChange).toHaveBeenCalledWith({
        group: 'Group',
        groupValue: null,
      });
    });
  });
});
