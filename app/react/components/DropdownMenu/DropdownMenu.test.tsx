import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DropdownMenu } from './DropdownMenu';

const defaultOptions = [
  { key: 'Docker', count: 3 },
  { key: 'Kubernetes', count: 2 },
];

function renderDropdown(
  overrides: Partial<React.ComponentProps<typeof DropdownMenu>> = {}
) {
  const props = {
    label: 'Group',
    options: defaultOptions,
    selected: null as string | null,
    onSelect: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<DropdownMenu {...props} />),
    props,
  };
}

describe('DropdownMenu', () => {
  test('renders the trigger button with the label', () => {
    renderDropdown({ label: 'Platform' });

    expect(
      screen.getByRole('button', { name: /Platform/i })
    ).toBeInTheDocument();
  });

  test('opens the menu on click showing All and all options', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(screen.getByRole('menu', { name: /Group/i })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /All/ })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /Docker/ })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: /Kubernetes/ })).toBeVisible();
  });

  test('displays counts for each option', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole('button', { name: /Group/i }));

    const menu = screen.getByRole('menu', { name: /Group/i });
    expect(menu).toHaveTextContent('3');
    expect(menu).toHaveTextContent('2');
  });

  test('renders option icons when provided', async () => {
    const user = userEvent.setup();
    renderDropdown({
      options: [
        { key: 'Docker', count: 3, icon: <span data-testid="docker-icon" /> },
      ],
    });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(
      document.querySelector('[data-testid="docker-icon"]')
    ).toBeInTheDocument();
  });

  test('renders option label when provided instead of key', async () => {
    const user = userEvent.setup();
    renderDropdown({
      options: [{ key: 'docker', label: 'Docker Engine', count: 5 }],
    });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(screen.getByText('Docker Engine')).toBeInTheDocument();
  });

  test('shows badge when badge is provided', () => {
    renderDropdown({ badge: 'Docker' });

    const button = screen.getByRole('button', { name: /Group/i });
    expect(button).toHaveTextContent('Docker');
  });

  test('does not show badge when badge is not provided', () => {
    renderDropdown({ badge: undefined });

    const button = screen.getByRole('button', { name: /Group/i });
    expect(button).not.toHaveTextContent('Docker');
  });

  test('calls onClick when trigger button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderDropdown({ onClick });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(onClick).toHaveBeenCalled();
  });

  test('closes the menu when clicking outside', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole('button', { name: /Group/i }));
    expect(screen.getByRole('menu', { name: /Group/i })).toBeVisible();

    await user.click(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('highlights the selected option', async () => {
    const user = userEvent.setup();
    renderDropdown({ selected: 'Docker' });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    const dockerItem = screen.getByRole('menuitem', { name: /Docker/ });
    expect(dockerItem.className).toContain('bg-blue-2');
  });

  test('highlights All when nothing is selected', async () => {
    const user = userEvent.setup();
    renderDropdown({ selected: null });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    const allItem = screen.getByRole('menuitem', { name: /All/ });
    expect(allItem.className).toContain('bg-blue-2');
  });

  test('applies custom className to trigger button', () => {
    renderDropdown({ className: 'custom-class' });

    expect(screen.getByRole('button', { name: /Group/i })).toHaveClass(
      'custom-class'
    );
  });

  test('shows loading spinner and hides menu items when options is undefined', async () => {
    const user = userEvent.setup();
    renderDropdown({ options: undefined });

    await user.click(screen.getByRole('button', { name: /Group/i }));

    expect(screen.getByText('Loading...')).toBeVisible();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  test('applies data-cy to trigger button', () => {
    renderDropdown({ 'data-cy': 'sort-by-group-button' });

    expect(screen.getByRole('button', { name: /Group/i })).toHaveAttribute(
      'data-cy',
      'sort-by-group-button'
    );
  });
});
