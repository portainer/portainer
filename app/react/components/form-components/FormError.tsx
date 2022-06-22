import { PropsWithChildren } from 'react';

export function FormError({ children }: PropsWithChildren<unknown>) {
  return (
    <div className="small text-warning">
      <i
        className="fa fa-exclamation-triangle space-right"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
