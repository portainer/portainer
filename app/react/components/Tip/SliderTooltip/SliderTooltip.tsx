import Tippy from '@tippyjs/react';
import clsx from 'clsx';

import 'tippy.js/dist/tippy.css';

import styles from './SliderTooltip.module.css';

export interface Props {
  value: string;
  child: React.ReactElement;
  delay: number;
  zIndex?: number;
}

export function SliderTooltip({ value, child, delay, zIndex = 50 }: Props) {
  return (
    <Tippy
      appendTo="parent"
      zIndex={zIndex} // make the z index lower than the dialog
      className={clsx(styles.tooltipCentered, styles.tooltip)}
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

  return <div className={styles.tooltipContainer}>{message}</div>;
}
