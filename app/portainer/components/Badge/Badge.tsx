import { ReactNode } from 'react';

export interface Props {
  value: string;
  icon?: ReactNode;
}

export function Badge({ icon, value }: Props) {
  return (
    <span className="badge">
      {icon}
      {value}
    </span>
  );
}
