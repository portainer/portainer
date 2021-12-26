import { Children, ReactNode, Fragment } from 'react';

import './Breadcrumbs.css';

interface Props {
  children: ReactNode | ReactNode[];
}

export function Breadcrumbs({ children }: Props) {
  const count = Children.count(children);
  return (
    <div className="breadcrumb-links">
      {Children.toArray(children).map((child, index) => (
        <Fragment key={index}>
          {child}
          {index !== count - 1 ? ' > ' : ''}
        </Fragment>
      ))}
    </div>
  );
}
