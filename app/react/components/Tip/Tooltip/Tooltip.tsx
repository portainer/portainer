import ReactTooltip from 'react-tooltip';
import { HelpCircle } from 'react-feather';

import styles from './Tooltip.module.css';

type Place = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Place;
  message: string;
}

export function Tooltip({ message, position = 'bottom' }: Props) {
  return (
    <span data-tip={message} className={styles.icon}>
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
