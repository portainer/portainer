import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import _ from 'lodash';

import 'tippy.js/dist/tippy.css';

import styles from './SliderTooltip.module.css';

export interface Props {
  value: string;
  child: React.ReactElement;
  delay: number;
}

export function SliderTooltip({ value, child, delay }: Props) {
  const id = _.uniqueId('tooltip-container-');

  return (
    <Tippy
      className={clsx(id, styles.tooltip, '')}
      content={messageHTML(value)}
      placement="top"
      showOnCreate
      hideOnClick={false}
      trigger="manual"
      delay={delay}
      arrow
      allowHTML
    >
      {child}
    </Tippy>
  );
}

function messageHTML(value: string) {
  let message = value;
  if (message === '0') {
    message = 'unlimited';
  }

  return (
    <div className={styles.tooltipContainer}>
      <div className={styles.tooltipMessage}>{message}</div>
    </div>
  );
}
