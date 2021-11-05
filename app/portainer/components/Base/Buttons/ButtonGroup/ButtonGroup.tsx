import { PropsWithChildren } from 'react';

type Size = 'xsmall' | 'small' | 'large';
export interface Props {
  size?: Size;
}

export function ButtonGroup({
  size = 'small',
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className={`btn-group ${sizeClass(size)}`} role="group">
      {children}
    </div>
  );
}

function sizeClass(size: Size | undefined) {
  switch (size) {
    case 'xsmall':
      return 'btn-group-xs';
    case 'large':
      return 'btn-group-lg';
    default:
      return 'btn-group-sm';
  }
}
