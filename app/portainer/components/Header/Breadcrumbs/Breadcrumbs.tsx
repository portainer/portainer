import { ReactNode } from 'react';

import './Breadcrumbs.css';

interface Props {
  children: ReactNode[];
}

export function Breadcrumbs({ children }: Props) {
  return (
    <div className="breadcrumb-links">
      {children.map((child, index) => (
        <>
          {child}
          {index !== children.length - 1 ? ' > ' : ''}
        </>
      ))}
    </div>
  );
}
