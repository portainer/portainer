import {
  ComponentType,
  ReactNode,
  PropsWithChildren,
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Plus, Edit } from 'lucide-react';
import { MenuItem } from '@reach/menu-button';
import { UIRouter } from '@uirouter/react';

import { MenuButton, MenuButtonLink, MenuButtonProps } from './MenuButton';

type MockCommonProps = Record<string, unknown>;
type MockWithChildren = { children?: ReactNode };
type MockMenuButtonProps = MockWithChildren & {
  as?: ComponentType<MockCommonProps>;
  onClick?: () => void;
} & MockCommonProps;
type MockMenuItemProps = MockWithChildren & {
  onSelect?: () => void;
  disabled?: boolean;
} & MockCommonProps;
type MockMenuLinkProps = MockWithChildren & {
  onClick?: () => void;
  href?: string;
  className?: string;
} & MockCommonProps;

type MockMenuProps = MockWithChildren;

type MockMenuFns = {
  Menu: (props: MockMenuProps) => ReactNode;
  MenuButton: (props: MockMenuButtonProps) => ReactNode;
  MenuPopover: (props: MockWithChildren) => ReactNode;
  MenuItem: (props: MockMenuItemProps) => ReactNode;
  MenuLink: (props: MockMenuLinkProps) => ReactNode;
  MenuList: (props: MockWithChildren) => ReactNode;
};

const mockUseSref = vi.hoisted(() => vi.fn());

vi.mock('@uirouter/react', () => ({
  UIRouter: ({ children }: MockWithChildren) => children,
  useSref: mockUseSref,
}));

vi.mock('@reach/menu-button', () => {
  type Ctx = {
    isOpen: boolean;
    setOpen: (v: boolean) => void;
    menuRef: React.RefObject<HTMLDivElement>;
  };
  const MenuCtx = createContext<Ctx | null>(null);

  function Menu({ children }: MockWithChildren) {
    const [isOpen, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleDocDown(e: MouseEvent) {
        const target = e.target as Node | null;
        if (
          isOpen &&
          menuRef.current &&
          target &&
          !menuRef.current.contains(target)
        ) {
          setOpen(false);
        }
      }
      document.addEventListener('mousedown', handleDocDown);
      return () => document.removeEventListener('mousedown', handleDocDown);
    }, [isOpen]);

    return (
      <MenuCtx.Provider value={{ isOpen, setOpen, menuRef }}>
        <div data-cy="menu" ref={menuRef}>
          {children}
        </div>
      </MenuCtx.Provider>
    );
  }

  function MenuButton({
    children,
    as: Component,
    onClick: externalOnClick,
    ...props
  }: MockMenuButtonProps) {
    const ctx = useContext(MenuCtx);
    function handleClick() {
      externalOnClick?.();
      ctx?.setOpen(!ctx.isOpen);
    }
    if (Component) {
      return (
        <Component data-cy="menu-button" onClick={handleClick} {...props}>
          {children}
        </Component>
      );
    }
    return (
      <button
        data-cy="menu-button"
        type="button"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }

  function MenuPopover({ children }: MockWithChildren) {
    const ctx = useContext(MenuCtx);
    if (!ctx?.isOpen) return null;
    return <div data-cy="menu-popover">{children}</div>;
  }

  function MenuItem({
    children,
    onSelect,
    disabled,
    ...props
  }: MockMenuItemProps) {
    const ctx = useContext(MenuCtx);
    function handleClick() {
      if (!disabled) {
        onSelect?.();
        ctx?.setOpen(false);
      }
    }
    return (
      <button
        data-cy="menu-item"
        role="menuitem"
        type="button"
        onClick={handleClick}
        disabled={Boolean(disabled)}
        style={{ opacity: disabled ? 0.5 : 1 }}
        {...props}
      >
        {children}
      </button>
    );
  }

  function MenuLink({
    children,
    onClick,
    href,
    className,
    ...props
  }: MockMenuLinkProps) {
    const ctx = useContext(MenuCtx);
    function handleClick() {
      onClick?.();
      ctx?.setOpen(false);
    }
    return (
      <a
        data-cy="menu-item"
        role="menuitem"
        href={href || '#'}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        {...props}
      >
        {children}
      </a>
    );
  }

  function MenuList({ children }: MockWithChildren) {
    const ctx = useContext(MenuCtx);
    if (!ctx?.isOpen) return null;
    return <div data-cy="menu-list">{children}</div>;
  }

  const exported: MockMenuFns = {
    Menu,
    MenuButton,
    MenuPopover,
    MenuItem,
    MenuLink,
    MenuList,
  };

  return exported;
});

function mapItems(items: Array<MockMenuButtonItem>) {
  return items.map((item) => item.element);
}

type MockMenuButtonItem = {
  id: string;
  element: ReactNode;
  handler?: () => void;
};

function createMockMenuItem({
  id,
  label,
  icon,
  onClick,
  disabled,
}: {
  id: string;
  label: string;
  icon?: ComponentType<unknown>;
  onClick?: () => void;
  disabled?: boolean;
}): MockMenuButtonItem {
  const IconComponent = icon;
  const handler = onClick;

  return {
    id,
    handler,
    element: (
      <MenuItem key={id} disabled={disabled} onSelect={handler ?? (() => {})}>
        {IconComponent ? <IconComponent /> : null}
        {label}
      </MenuItem>
    ),
  };
}

const mockItems: Array<MockMenuButtonItem> = [
  createMockMenuItem({
    id: 'create',
    label: 'Create new',
    icon: Plus,
    onClick: vi.fn(),
  }),
  createMockMenuItem({
    id: 'edit',
    label: 'Edit existing',
    icon: Edit,
    onClick: vi.fn(),
  }),
];

type RenderOptions = Omit<
  Partial<PropsWithChildren<MenuButtonProps>>,
  'items'
> & {
  items?: Array<MockMenuButtonItem>;
};

function renderDefault({
  items = mockItems,
  children = 'Test Menu',
  color = 'primary',
  size = 'small',
  disabled = false,
  ...props
}: RenderOptions = {}) {
  return render(
    <MenuButton
      items={mapItems(items)}
      color={color}
      size={size}
      disabled={disabled}
      data-cy="menu-button"
      {...props}
    >
      {children}
    </MenuButton>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Set default mock implementation
  mockUseSref.mockReturnValue({
    href: '#default',
    onClick: vi.fn(),
  });
});

test('should display MenuButton with correct text and chevron icon', async () => {
  const children = 'Test Actions';
  renderDefault({ children });

  const button = await screen.findByText(children);
  expect(button).toBeTruthy();

  // Check for chevron down icon (it should be in the DOM)
  const chevronIcon = button.closest('button')?.querySelector('svg');
  expect(chevronIcon).toBeTruthy();
});

test('should not show menu items by default', async () => {
  renderDefault();
  expect(screen.queryByRole('menuitem')).toBeNull();
});

test('should show menu items when clicked', async () => {
  renderDefault();
  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);
  expect(await screen.findByText('Create new')).toBeTruthy();
  expect(await screen.findByText('Edit existing')).toBeTruthy();
});

test('should hide menu items when something else is clicked', async () => {
  renderDefault();
  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);
  expect(await screen.findByText('Create new')).toBeTruthy();

  // click outside
  fireEvent.mouseDown(document.body);
  // items should disappear
  expect(screen.queryByText('Create new')).toBeNull();
  expect(screen.queryByText('Edit existing')).toBeNull();
});

test('should call onClick when menu item is clicked', async () => {
  renderDefault();

  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);

  const createItem = await screen.findByText('Create new');
  fireEvent.click(createItem);

  expect(mockItems[0].handler).toHaveBeenCalled();
});

test('should not call onClick when disabled item is clicked', async () => {
  const disabledItemMock = createMockMenuItem({
    id: 'disabled',
    label: 'Disabled action',
    disabled: true,
    onClick: vi.fn(),
  });

  renderDefault({ items: [disabledItemMock] });

  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);

  const disabledItem = await screen.findByText('Disabled action');
  fireEvent.click(disabledItem);

  expect(disabledItemMock.handler).not.toHaveBeenCalled();
});

test('should support link items', async () => {
  const mockOnClick = vi.fn();

  // Set up the mock to return our test onClick function
  mockUseSref.mockReturnValue({
    href: '#kubernetes.deploy',
    onClick: mockOnClick,
  });

  render(
    <UIRouter>
      <MenuButton
        items={[
          <MenuButtonLink
            key="docs"
            to="kubernetes.deploy"
            params={{}}
            options={{}}
            label="Docs"
            data-cy="menu-button-link-docs"
          >
            Deploy
          </MenuButtonLink>,
        ]}
        color="primary"
        data-cy="menu-button-link"
      >
        Mixed
      </MenuButton>
    </UIRouter>
  );

  const trigger = await screen.findByText('Mixed');
  fireEvent.click(trigger);

  const link = await screen.findByText('Deploy');
  fireEvent.click(link);
  expect(mockOnClick).toHaveBeenCalled();
});

test('should be disabled when disabled prop is true', async () => {
  renderDefault({ disabled: true });

  const button = await screen.findByText('Test Menu');
  expect(button.closest('button')).toBeDisabled();
  expect(button.closest('button')).toHaveClass('disabled');
});

test('should render menu items with icons', async () => {
  renderDefault();

  const trigger = await screen.findByText('Test Menu');
  fireEvent.click(trigger);

  // Check that menu items have icons (SVG elements)
  const createItem = await screen.findByText('Create new');
  const editItem = await screen.findByText('Edit existing');

  expect(
    createItem.closest('[role="menuitem"]')?.querySelector('svg')
  ).toBeTruthy();
  expect(
    editItem.closest('[role="menuitem"]')?.querySelector('svg')
  ).toBeTruthy();
});

test('should render with custom className', async () => {
  renderDefault({ className: 'custom-class' });

  const button = await screen.findByText('Test Menu');
  expect(button.closest('button')).toHaveClass('custom-class');
});

test('should have proper accessibility attributes for screen readers', async () => {
  const mockOnClick = vi.fn();

  // Set up the mock to return our test onClick function
  mockUseSref.mockReturnValue({
    href: '#kubernetes.deploy',
    onClick: mockOnClick,
  });

  render(
    <UIRouter>
      <MenuButton
        items={[
          <MenuButtonLink
            key="docs"
            to="kubernetes.deploy"
            params={{}}
            options={{}}
            label="Deploy"
            data-cy="menu-button-link-docs"
          >
            Deploy
          </MenuButtonLink>,
        ]}
        color="primary"
        data-cy="menu-button-keyboard"
      >
        Accessibility Test
      </MenuButton>
    </UIRouter>
  );

  const trigger = await screen.findByText('Accessibility Test');

  // Open menu to reveal the link
  fireEvent.click(trigger);

  const link = await screen.findByText('Deploy');
  expect(link).toBeVisible();

  // Test that the link has proper accessibility attributes
  expect(link).toHaveAttribute('aria-label', 'Deploy'); // Screen reader support
  expect(link).toHaveAttribute('role', 'menuitem'); // Proper ARIA role
  expect(link).toHaveAttribute('href'); // Has navigation href
});
