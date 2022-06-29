import { PropsWithChildren } from 'react';

import { useSidebarState } from './useSidebarState';

interface Props {
  title: string;
}

export function SidebarSection({ title, children }: PropsWithChildren<Props>) {
  return (
    <div>
      <SidebarSectionTitle>{title}</SidebarSectionTitle>

      <nav aria-label={title} className="mt-4">
        <ul>{children}</ul>
      </nav>
    </div>
  );
}

export function SidebarSectionTitle({ children }: PropsWithChildren<unknown>) {
  const { isOpen } = useSidebarState();

  if (!isOpen) {
    return null;
  }

  return (
    <li className="ml-3 text-sm text-gray-3 be:text-gray-6 transition-all duration-500 ease-in-out">
      {children}
    </li>
  );
}
