import { ReactNode } from 'react';

export interface Props {
  value: string;
  icon?: ReactNode;
  color: string;
}

// Helper function used as workaround to add opacity to the background color
function setOpacity(hex: string, alpha: number) {
  return `${hex}${Math.floor(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

export function Badge({ icon, value, color }: Props) {
  return (
    <span
      className="badge inline-flex items-center"
      style={{
        backgroundColor: setOpacity(color, 0.1),
        color,
        padding: '5px 10px',
      }}
    >
      {icon}
      {value}
    </span>
  );
}
