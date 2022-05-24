import { ReactNode } from 'react';

export interface Props {
  value: string;
  icon?: ReactNode;
  color: string;
}

export function Badge({ icon, value, color }: Props) {
  return (
    <span
      className="badge inline-flex items-center"
      style={{ backgroundColor: color }}
    >
      {icon}
      {value}
    </span>
  );
}
