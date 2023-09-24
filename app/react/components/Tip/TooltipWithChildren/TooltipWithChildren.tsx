import React, { MouseEvent } from 'react';
import Tippy from '@tippyjs/react';
import clsx from 'clsx';
import _ from 'lodash';

import 'tippy.js/dist/tippy.css';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

import styles from './TooltipWithChildren.module.css';

export type Position = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Position;
  message: React.ReactNode;
  className?: string;
  children: React.ReactElement;
  heading?: string;
  BEFeatureID?: FeatureId;
}

export function TooltipWithChildren({
  message,
  position = 'bottom',
  className,
  children,
  heading,
  BEFeatureID,
}: Props) {
  const id = _.uniqueId('tooltip-');

  const { url, limitedToBE } = BEFeatureID
    ? getFeatureDetails(BEFeatureID)
    : { url: '', limitedToBE: false };

  const messageHTML = (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className={styles.tooltipContainer} onClick={onClickHandler}>
      {(heading || (BEFeatureID && limitedToBE)) && (
        <div className="mb-3 inline-flex w-full justify-between">
          <span>{heading}</span>
          {BEFeatureID && limitedToBE && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={styles.tooltipBeteaser}
            >
              Business Feature
            </a>
          )}
        </div>
      )}
      <div className={styles.tooltipMessage}>{message}</div>
    </div>
  );

  return (
    <Tippy
      className={clsx(id, styles.tooltip, className)}
      content={messageHTML}
      delay={[50, 500]} // 50ms to open, 500ms to hide
      zIndex={1000}
      placement={position}
      maxWidth={400}
      arrow
      allowHTML
      interactive
      disabled={!message}
    >
      {children}
    </Tippy>
  );
}

// Preventing click bubbling to the parent as it is affecting
// mainly toggles when full row is clickable.
function onClickHandler(e: MouseEvent) {
  const target = e.target as HTMLInputElement;
  if (target.tagName.toLowerCase() === 'a') {
    const url = target.getAttribute('href');
    if (url) {
      window.open(url, '_blank');
    }
  }
  e.preventDefault();
}
