import { PropsWithChildren } from 'react';

import { FormSectionTitle } from '../FormSectionTitle';

interface Props {
  title: string;
}

export function FormSection({ title, children }: PropsWithChildren<Props>) {
  return (
    <>
      <FormSectionTitle>{title}</FormSectionTitle>

      {children}
    </>
  );
}
