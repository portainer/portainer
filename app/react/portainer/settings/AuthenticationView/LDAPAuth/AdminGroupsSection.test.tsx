import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ComponentProps } from 'react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { AdminGroupsSection } from './AdminGroupsSection';

const Wrapped = withTestQueryProvider(AdminGroupsSection);

const defaultSearchSettings = [
  { GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' },
];

describe('AdminGroupsSection', () => {
  test('renders section title and fetch button', () => {
    renderComponent();

    expect(screen.getByText(/auto-populate team admins/i)).toBeVisible();
    expect(
      screen.getByRole('button', { name: /fetch admin group\(s\)/i })
    ).toBeVisible();
  });

  test('renders one config item with toggle disabled and no group selector', () => {
    renderComponent();

    expect(
      screen.getAllByRole('textbox', { name: /group base dn/i })
    ).toHaveLength(1);
    expect(
      screen.getByRole('checkbox', { name: /assign admin rights/i })
    ).toBeDisabled();
    expect(
      screen.queryByLabelText(/select group\(s\)/i)
    ).not.toBeInTheDocument();
  });

  test('add button calls onSearchSettingsChange with a new empty item', async () => {
    const user = userEvent.setup();
    const onSearchSettingsChange = vi.fn();
    renderComponent({ onSearchSettingsChange });

    await user.click(
      screen.getByRole('button', { name: /add group search configuration/i })
    );

    expect(onSearchSettingsChange).toHaveBeenCalledWith(
      [
        ...defaultSearchSettings,
        { GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' },
      ],
      expect.anything()
    );
  });

  test('first config item has no delete button, second does', () => {
    renderComponent({
      searchSettings: [
        { GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' },
        { GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' },
      ],
    });

    const firstWidget = screen.getByRole('region', {
      name: 'Admin group search configuration 1',
    });
    const secondWidget = screen.getByRole('region', {
      name: 'Admin group search configuration 2',
    });

    expect(
      within(firstWidget).queryByRole('button', { name: 'Remove item' })
    ).not.toBeInTheDocument();
    expect(
      within(firstWidget).queryByText('Extra search configuration')
    ).not.toBeInTheDocument();
    expect(
      within(secondWidget).getByText('Extra search configuration')
    ).toBeVisible();
    expect(
      within(secondWidget).getByRole('button', { name: 'Remove item' })
    ).toBeVisible();
  });

  test('calls onSearchSettingsChange without deleted item when delete is clicked', async () => {
    const user = userEvent.setup();
    const onSearchSettingsChange = vi.fn();
    const firstItem = {
      GroupBaseDN: 'dc=example,dc=com',
      GroupAttribute: 'member',
      GroupFilter: '',
    };

    renderComponent({
      onSearchSettingsChange,
      searchSettings: [
        firstItem,
        { GroupBaseDN: '', GroupAttribute: '', GroupFilter: '' },
      ],
    });

    const secondWidget = screen.getByRole('region', {
      name: 'Admin group search configuration 2',
    });
    await user.click(
      within(secondWidget).getByRole('button', { name: 'Remove item' })
    );

    expect(onSearchSettingsChange).toHaveBeenCalledWith(
      [firstItem],
      expect.anything()
    );
  });

  test('calls onSearchSettingsChange when config fields are updated', async () => {
    const user = userEvent.setup();
    const onSearchSettingsChange = vi.fn();
    renderComponent({ onSearchSettingsChange });

    await user.type(
      screen.getByRole('textbox', { name: /group base dn/i }),
      'd'
    );
    expect(onSearchSettingsChange).toHaveBeenCalledWith(
      [expect.objectContaining({ GroupBaseDN: 'd' })],
      expect.anything()
    );

    await user.type(
      screen.getByRole('textbox', { name: /group membership attribute/i }),
      'm'
    );
    expect(onSearchSettingsChange).toHaveBeenCalledWith(
      [expect.objectContaining({ GroupAttribute: 'm' })],
      expect.anything()
    );

    await user.type(
      screen.getByRole('textbox', { name: /group filter/i }),
      '('
    );
    expect(onSearchSettingsChange).toHaveBeenCalledWith(
      [expect.objectContaining({ GroupFilter: '(' })],
      expect.anything()
    );
  });
});

function renderComponent(
  overrides: Partial<ComponentProps<typeof AdminGroupsSection>> = {}
) {
  const props: ComponentProps<typeof AdminGroupsSection> = {
    searchSettings: defaultSearchSettings,
    onSearchSettingsChange: vi.fn(),
    autoPopulate: false,
    onAutoPopulateChange: vi.fn(),
    selectedAdminGroups: [],
    onSelectedAdminGroupsChange: vi.fn(),
    groups: null,
    isFetching: false,
    onFetch: vi.fn(),
    ...overrides,
  };
  return render(<Wrapped {...props} />);
}
