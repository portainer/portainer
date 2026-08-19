import {
  Children,
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
  ReactNode,
} from 'react';

type MenuCtxType = {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement>;
  label: string;
  setLabel: (v: string) => void;
};

const MenuCtx = createContext<MenuCtxType | null>(null);

export function Menu({ children }: { children?: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [label, setLabel] = useState('');
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
    <MenuCtx.Provider value={{ isOpen, setOpen, menuRef, label, setLabel }}>
      <div ref={menuRef}>{children}</div>
    </MenuCtx.Provider>
  );
}

export function MenuButton({
  children,
  onClick: externalOnClick,
  ...props
}: {
  children?: ReactNode;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  const ctx = useContext(MenuCtx);

  useEffect(() => {
    const firstText = Children.toArray(children).find(
      (c) => typeof c === 'string'
    );
    if (firstText) ctx?.setLabel(firstText as string);
  });

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

export function MenuList({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const ctx = useContext(MenuCtx);
  if (!ctx?.isOpen) return null;
  return (
    <div role="menu" aria-label={ctx.label || undefined} className={className}>
      {children}
    </div>
  );
}

export function MenuItem({
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
