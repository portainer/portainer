import { PropsWithChildren } from 'react';

interface Props {
  htmlFor?: string;
}

export function FormSectionTitle({
  children,
  htmlFor,
}: PropsWithChildren<Props>) {
  if (htmlFor) {
    return (
      <label
        htmlFor={htmlFor}
        className="col-sm-12 form-section-title flex cursor-pointer items-center"
      >
        {children}
      </label>
    );
  }
  return <div className="col-sm-12 form-section-title">{children}</div>;
}
