import ReactTooltip from 'react-tooltip';
import { HelpCircle } from 'react-feather';
import clsx from 'clsx';
import _ from 'lodash';

import styles from './Tooltip.module.css';

type Position = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Position;
  message: string;
}

export function Tooltip({ message, position = 'bottom' }: Props) {
  const id = `tooltip-${_.uniqueId()}`;

  return (
    <span
      data-tip={message}
      data-for={id}
      className={clsx(styles.icon, 'inline-flex text-base')}
    >
      <HelpCircle className="feather" aria-hidden="true" />
      <ReactTooltip
        id={id}
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
