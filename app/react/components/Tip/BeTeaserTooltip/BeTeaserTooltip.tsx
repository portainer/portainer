import ReactTooltip from 'react-tooltip';
import clsx from 'clsx';
import _ from 'lodash';
import ReactDOMServer from 'react-dom/server';

import { FeatureId } from '@/portainer/feature-flags/enums';

import { getFeatureDetails } from '@@/BEFeatureIndicator/utils';

import styles from './BeTeaserTooltip.module.css';

type Position = 'top' | 'right' | 'bottom' | 'left';

export interface Props {
  position?: Position;
  message: string;
  className?: string;
  children: React.ReactNode;
  heading: string;
  BEFeatureID?: FeatureId;
}

export function BeTeaserTooltip({
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
    <div className={clsx(styles.tooltipContainer)}>
      <div className="w-full mb-3 inline-flex justify-between">
        <span className="tooltip-heading">{heading}</span>
        {BEFeatureID && limitedToBE && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={clsx(styles.tooltipBeteaser)}
          >
            Business edition only
          </a>
        )}
      </div>
      <div className="tooltip-message">{message}</div>
    </div>
  );

  return (
    <span
      data-html
      data-multiline
      data-tip={ReactDOMServer.renderToString(messageHTML)}
      data-for={id}
      className={clsx(styles.icon, 'inline-flex text-base')}
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
        delayHide={2000}
        clickable
      />
    </span>
  );
}
