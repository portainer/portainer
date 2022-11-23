import ReactTooltip from 'react-tooltip';
import clsx from 'clsx';
import _ from 'lodash';
import ReactDOMServer from 'react-dom/server';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

import styles from './TooltipWithChildren.module.css';

type Position = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Position;
  message: string;
  className?: string;
  children: React.ReactNode;
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
    <div className={styles.tooltipContainer}>
      {(heading || (BEFeatureID && limitedToBE)) && (
        <div
          className={clsx(
            'w-full mb-2 inline-flex justify-between',
            styles.tooltipHeading
          )}
        >
          {heading && <span>{heading}</span>}
          {BEFeatureID && limitedToBE && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={styles.tooltipBeteaser}
            >
              Business Edition Only
            </a>
          )}
        </div>
      )}
      <div>{message}</div>
    </div>
  );

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <span
      data-html
      data-multiline
      data-tip={ReactDOMServer.renderToString(messageHTML)}
      data-for={id}
      className={clsx(styles.icon, 'inline-flex text-base')}
      onClick={(e) => e.preventDefault()} // click is boucing to the element behind the tooltip so preventing it.
    >
      {children}
      <ReactTooltip
        id={id}
        multiline
        type="info"
        place={position}
        effect="solid"
        className={clsx(styles.tooltip, className)}
        arrowColor="var(--bg-tooltip-color)"
        delayHide={400}
        clickable
      />
    </span>
  );
}
