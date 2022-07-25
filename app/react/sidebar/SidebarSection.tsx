import { PropsWithChildren, ReactNode } from 'react';

import { useSidebarState } from './useSidebarState';

interface Props {
  title: ReactNode;
  showTitleWhenOpen?: boolean;
  'aria-label'?: string;
}

export function SidebarSection({
  title,
  children,
  showTitleWhenOpen,
  'aria-label': ariaLabel,
}: PropsWithChildren<Props>) {
  return (
    <div>
      <SidebarSectionTitle showWhenOpen={showTitleWhenOpen}>
        {title}
      </SidebarSectionTitle>

      <nav
        aria-label={typeof title === 'string' ? title : ariaLabel}
        className="mt-4"
      >
        <ul>{children}</ul>
      </nav>
    </div>
  );
}

interface TitleProps {
  showWhenOpen?: boolean;
}

export function SidebarSectionTitle({
  showWhenOpen,
  children,
}: PropsWithChildren<TitleProps>) {
  const { isOpen } = useSidebarState();

  if (!isOpen && !showWhenOpen) {
    return null;
  }

  return (
    <li className="ml-3 text-sm text-gray-3 be:text-gray-6 transition-all duration-500 ease-in-out">
      {children}
    </li>
  );
}
