import clsx from 'clsx';
import { PropsWithChildren, ReactNode } from 'react';

import styles from './SidebarSection.module.css';
import { useSidebarState } from './useSidebarState';

interface Props {
  title: string;
  renderTitle?: (className: string) => ReactNode;
}

export function SidebarSection({
  title,
  renderTitle,
  children,
}: PropsWithChildren<Props>) {
  const { isOpen } = useSidebarState();
  const titleClassName = clsx(styles.sidebarTitle, 'ml-3 text-sm text-grey-8');
  return (
    <div>
      {renderTitle
        ? renderTitle(titleClassName)
        : isOpen && <li className={titleClassName}>{title}</li>}

      <nav aria-label={title} className="mt-4">
        <ul>{children}</ul>
      </nav>
    </div>
  );
}
