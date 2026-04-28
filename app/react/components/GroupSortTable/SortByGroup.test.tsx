import {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
} from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';

import { SortByGroup, SortOption } from './SortByGroup';

type MenuCtxType = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
};

vi.mock('@reach/menu-button', () => {
  const MenuCtx = createContext<MenuCtxType | null>(null);

  function Menu({ children }: { children?: ReactNode }) {
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
        <div ref={menuRef}>{children}</div>
      </MenuCtx.Provider>
    );
  }

  function MenuButton({
    children,
    onClick: externalOnClick,
    ...props
  }: {
    children?: ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) {
    const ctx = useContext(MenuCtx);
    function handleClick() {
      externalOnClick?.();
      ctx?.setOpen(!ctx.isOpen);
    }
    return (
      <button type="button" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }

  function MenuList({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) {
    const ctx = useContext(MenuCtx);
    if (!ctx?.isOpen) return null;
    return (
      <div role="menu" className={className}>
        {children}
      </div>
    );
  }

  function MenuItem({
    children,
    onSelect,
    className,
  }: {
    children?: ReactNode;
    onSelect?: () => void;
    className?: string;
  }) {
    const ctx = useContext(MenuCtx);
    function handleClick() {
      onSelect?.();
      ctx?.setOpen(false);
    }
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
      <div role="menuitem" onClick={handleClick} className={className}>
        {children}
      </div>
    );
  }

  return { Menu, MenuButton, MenuList, MenuItem };
});

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
  sortBy = 'Group' as string,
  groupFilter = null as string | null,
  onSortChange = vi.fn(),
  onGroupFilterChange = vi.fn(),
} = {}) {
  const Wrapped = withTestQueryProvider(
    withTestRouter(() => (
      <SortByGroup
        sortBy={sortBy}
        onSortChange={onSortChange}
        sortOptions={sortOptions}
        groupFilter={groupFilter}
        groupOptions={groupOptions}
        onGroupFilterChange={onGroupFilterChange}
        dataCy="test"
      />
    ))
  );
  return { ...render(<Wrapped />), onSortChange, onGroupFilterChange };
}

describe('SortByGroup', () => {
  describe('grouped: false option', () => {
    test('clicking an inactive button calls onSortChange', async () => {
      const user = userEvent.setup();
      const { onSortChange } = renderComponent({ sortBy: 'Group' });

      await user.click(screen.getByRole('button', { name: /^Name$/i }));

      expect(onSortChange).toHaveBeenCalledExactlyOnceWith('Name');
    });

    test('clicking the already-active button does not call onSortChange', async () => {
      const user = userEvent.setup();
      const { onSortChange } = renderComponent({ sortBy: 'Name' });

      await user.click(screen.getByRole('button', { name: /^Name$/i }));

      expect(onSortChange).not.toHaveBeenCalled();
    });
  });

  describe('grouped: true option', () => {
    test('clicking the dropdown button to open it does not call onSortChange', async () => {
      const user = userEvent.setup();
      const { onSortChange } = renderComponent({ sortBy: 'Group' });

      // Click Platform button (inactive grouped option) — should just open menu
      await user.click(screen.getByRole('button', { name: /^Platform$/i }));

      expect(onSortChange).not.toHaveBeenCalled();
    });

    test('selecting a filter from an inactive grouped option calls onSortChange and onGroupFilterChange', async () => {
      const user = userEvent.setup();
      const { onSortChange, onGroupFilterChange } = renderComponent({
        sortBy: 'Group',
      });

      await user.click(screen.getByRole('button', { name: /^Platform$/i }));
      await user.click(screen.getByRole('menuitem', { name: /Docker/ }));

      expect(onSortChange).toHaveBeenCalledExactlyOnceWith('Platform');
      expect(onGroupFilterChange).toHaveBeenCalledExactlyOnceWith('Docker');
    });

    test('selecting a filter from the already-active grouped option does not call onSortChange', async () => {
      const user = userEvent.setup();
      const { onSortChange, onGroupFilterChange } = renderComponent({
        sortBy: 'Group',
        groupFilter: null,
      });

      await user.click(screen.getByRole('button', { name: /^Group$/i }));
      await user.click(screen.getByRole('menuitem', { name: /GroupA/ }));

      expect(onSortChange).not.toHaveBeenCalled();
      expect(onGroupFilterChange).toHaveBeenCalledExactlyOnceWith('GroupA');
    });

    test('selecting All from a grouped dropdown calls onGroupFilterChange with null', async () => {
      const user = userEvent.setup();
      const { onSortChange, onGroupFilterChange } = renderComponent({
        sortBy: 'Group',
        groupFilter: 'GroupA',
      });

      await user.click(screen.getByRole('button', { name: /^Group/i }));
      await user.click(screen.getByRole('menuitem', { name: /^All$/ }));

      expect(onSortChange).not.toHaveBeenCalled();
      expect(onGroupFilterChange).toHaveBeenCalledWith(null);
    });
  });
});
