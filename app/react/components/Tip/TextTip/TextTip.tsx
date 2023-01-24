import { PropsWithChildren } from 'react';
import { AlertCircle } from 'lucide-react';

import { Icon, IconMode } from '@@/Icon';

type Color = 'orange' | 'blue';

export interface Props {
  icon?: React.ReactNode;
  color?: Color;
}

export function TextTip({
  color = 'orange',
  icon = AlertCircle,
  children,
}: PropsWithChildren<Props>) {
  return (
    <p className="small flex items-center gap-1">
      <Icon icon={icon} mode={getMode(color)} />

      <span className="text-muted">{children}</span>
    </p>
  );
}

function getMode(color: Color): IconMode {
  switch (color) {
    case 'blue':
      return 'primary';
    case 'orange':
    default:
      return 'warning';
  }
}
