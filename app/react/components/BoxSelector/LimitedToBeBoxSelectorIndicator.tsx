import { Briefcase } from 'lucide-react';

import { Icon } from '@@/Icon';
import { Tooltip } from '@@/Tip/Tooltip';

interface Props {
  url?: string;
  showTooltip?: boolean;
}

export function LimitedToBeBoxSelectorIndicator({
  url,
  showTooltip = true,
}: Props) {
  return (
    <div className="absolute left-0 top-0 w-full">
      <div className="mx-auto flex max-w-fit items-center rounded-b-lg border border-t-0 border-solid border-gray-6 bg-transparent px-3 py-1 text-gray-6">
        <a
          className="inline-flex items-center text-xs text-gray-6"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon={Briefcase} className="!mr-1" />
          <span>Business Feature</span>
        </a>
        {showTooltip && (
          <Tooltip
            size="sm"
            message="Select this option to preview this business feature."
          />
        )}
      </div>
    </div>
  );
}
