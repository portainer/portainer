import { PropsWithChildren } from 'react';

export interface Props {
  title?: string;
}

export function Heading({ title = '', children }: PropsWithChildren<Props>) {
  return (
    <div className="col-sm-12 form-section-title">{title || children}</div>
  );
}
