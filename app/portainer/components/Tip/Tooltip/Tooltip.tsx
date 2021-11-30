import ReactTooltip from 'react-tooltip';
import clsx from 'clsx';

import styles from './Tooltip.module.css';

type Place = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Place;
  message: string;
}

export function Tooltip({ message, position = 'bottom' }: Props) {
  return (
    <span className="interactive">
      <i
        className={clsx('fa fa-question-circle blue-icon', styles.icon)}
        aria-hidden="true"
        data-tip={message}
      />
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
