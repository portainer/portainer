import { PropsWithChildren } from 'react';

import { useInputGroupContext } from './InputGroup';

/**
 * Should wrap all buttons inside a InputGroup
 *
 * example:
 * ```
 * <InputGroup>
 *  <InputGroup.ButtonWrapper>
 *   <Button>...</Button>
 *   <Button>...</Button>
 *  </InputGroup.ButtonWrapper>
 * </InputGroup>
 * ```
 */
export function InputGroupButtonWrapper({
  children,
}: PropsWithChildren<unknown>) {
  useInputGroupContext();

  return <span className="input-group-btn">{children}</span>;
}
