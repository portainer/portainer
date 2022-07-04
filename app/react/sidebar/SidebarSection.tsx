import { PropsWithChildren, ReactNode } from 'react';

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
  const titleClassName =
    'ml-3 text-sm text-gray-3 be:text-gray-6 transition-all duration-500 ease-in-out';

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
