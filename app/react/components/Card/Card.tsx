import { PropsWithChildren } from 'react';

import { Card as CardPrimitive } from '../primitives/Card';

export interface Props {
  className?: string;
}

/** @deprecated Use Card.Container from @@/primitives/Card with variant="filled" */
export function Card({ className, children }: PropsWithChildren<Props>) {
  return (
    <CardPrimitive.Container variant="filled" className={className}>
      <CardPrimitive.Body>{children}</CardPrimitive.Body>
    </CardPrimitive.Container>
  );
}
