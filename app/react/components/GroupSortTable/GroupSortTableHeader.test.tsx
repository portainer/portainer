import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupSortTableHeader } from './GroupSortTableHeader';

const defaultSortOptions = [
  { key: 'Group' as const, label: 'Group', grouped: true },
  { key: 'Platform' as const, label: 'Platform', grouped: true },
  { key: 'Health' as const, label: 'Health' },
];

const defaultGroups = [
  { key: 'Docker', count: 3 },
  { key: 'Kubernetes', count: 2 },
];

function renderHeader(
  overrides: Partial<
    React.ComponentProps<typeof GroupSortTableHeader<string>>
  > = {}
) {
  const props = {
    sortBy: 'Group' as string,
    sortDesc: false,
    onSortChange: vi.fn(),
    searchTerm: '',
    onSearchChange: vi.fn(),
    sortOptions: defaultSortOptions,
    groupFilter: null,
    groupOptions: { Group: defaultGroups, Platform: defaultGroups },
    onGroupFilterChange: vi.fn(),
    'data-cy': 'cy',
    ...overrides,
  };

  return {
    ...render(<GroupSortTableHeader {...props} />),
    props,
  };
}

describe('GroupSortTableHeader', () => {
  test('clicking the active sort button opens the dropdown with group options', async () => {
    const user = userEvent.setup();
    renderHeader({ sortBy: 'Group' });

    const groupBtn = screen.getByRole('button', { name: /Group/i });
    await user.click(groupBtn);

    expect(screen.getByRole('menu', { name: /Group/i })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /All/ })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /Docker/ })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /Kubernetes/ })).toBeVisible();
  });

  test('clicking an inactive grouped sort button opens the dropdown without calling onSortChange', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    renderHeader({ sortBy: 'Group', onSortChange });

    await user.click(screen.getByRole('button', { name: /Platform/i }));

    expect(onSortChange).not.toHaveBeenCalled();
    expect(screen.getByRole('menu', { name: /Platform/i })).toBeVisible();
  });

  test('dropdown shows group options when opened', async () => {
    const user = userEvent.setup();
    renderHeader({
      sortBy: 'Group',
      sortOptions: [{ key: 'Group' as const, label: 'Group', grouped: true }],
    });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(screen.getByRole('menuitem', { name: /Docker/ })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /Kubernetes/ })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /All/ })).toBeVisible();
  });

  test('active group filter is shown as a badge inside the active sort button', () => {
    renderHeader({ sortBy: 'Group', groupFilter: 'Docker' });

    const groupBtn = screen.getByRole('button', { name: /Group/i });
    expect(groupBtn).toHaveTextContent('Docker');
  });

  test('clicking outside the dropdown closes it', async () => {
    const user = userEvent.setup();
    renderHeader({ sortBy: 'Group' });

    await user.click(screen.getByRole('button', { name: /Group/i }));
    expect(screen.getByRole('menu', { name: /Group/i })).toBeVisible();

    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('search input renders with the correct placeholder', () => {
    renderHeader();

    expect(screen.getByPlaceholderText('Filter...')).toBeInTheDocument();
  });

  test('search input accepts user input', async () => {
    const user = userEvent.setup();
    renderHeader();

    const searchInput = screen.getByPlaceholderText('Filter...');
    await user.type(searchInput, 'test');

    expect(searchInput).toHaveValue('test');
  });

  test('renders custom search placeholder', () => {
    renderHeader({ searchPlaceholder: 'Search environments...' });

    expect(
      screen.getByPlaceholderText('Search environments...')
    ).toBeInTheDocument();
  });

  test('renders action button when provided', () => {
    renderHeader({
      actionButton: <button type="button">Add item</button>,
    });

    expect(
      screen.getByRole('button', { name: /Add item/i })
    ).toBeInTheDocument();
  });

  test('All option is present in dropdown menu', async () => {
    const user = userEvent.setup();
    renderHeader({
      sortBy: 'Group',
      groupFilter: 'Docker',
      sortOptions: [{ key: 'Group' as const, label: 'Group', grouped: true }],
    });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(screen.getByRole('menuitem', { name: /All/ })).toBeVisible();
  });

  test('displays group counts in dropdown', async () => {
    const user = userEvent.setup();
    renderHeader({
      sortBy: 'Group',
      sortOptions: [{ key: 'Group' as const, label: 'Group', grouped: true }],
    });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    const menu = screen.getByRole('menu', { name: /Group/i });
    expect(menu).toHaveTextContent('3');
    expect(menu).toHaveTextContent('2');
  });

  test('renders all sort option buttons', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: /Group/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Platform/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Health/i })).toBeInTheDocument();
  });
});
