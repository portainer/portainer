import { PropsWithChildren } from 'react';

export function FormSectionTitle({ children }: PropsWithChildren<unknown>) {
  return <div className="col-sm-12 form-section-title">{children}</div>;
}
