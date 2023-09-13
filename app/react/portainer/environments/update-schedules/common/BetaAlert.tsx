import { ReactNode } from 'react';

import betaIcon from '@/assets/ico/beta.svg?c';

import { TextTip } from '@@/Tip/TextTip';

interface Props {
  message: ReactNode;
  className?: string;
  isHtml?: boolean;
}

export function BetaAlert({ message, className, isHtml }: Props) {
  return (
    <TextTip icon={betaIcon} className={className}>
      <div className="text-warning">
        {isHtml && typeof message === 'string' ? (
          // eslint-disable-next-line react/no-danger
          <span dangerouslySetInnerHTML={{ __html: message }} />
        ) : (
          message
        )}
      </div>
    </TextTip>
  );
}
