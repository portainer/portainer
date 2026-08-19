import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SortableListItem({ children }: Props) {
  return (
    <div className="border-0 border-b border-solid border-gray-5 px-5 py-3 th-dark:border-gray-9">
      {children}
    </div>
  );
}
