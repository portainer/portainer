import ReactTooltip from 'react-tooltip';
import { HelpCircle } from 'react-feather';
import clsx from 'clsx';

import styles from './Tooltip.module.css';

type Position = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Position;
  message: string;
}

export function Tooltip({ message, position = 'bottom' }: Props) {
  return (
    <span
      data-tip={message}
      className={clsx(styles.icon, 'inline-flex text-base')}
    >
      <HelpCircle className="feather" aria-hidden="true" />
      <ReactTooltip
        multiline
        type="info"
        place={position}
        effect="solid"
        className={styles.tooltip}
        arrowColor="transparent"
      />
    </span>
  );
}
