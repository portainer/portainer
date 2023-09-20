import { Briefcase } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  url?: string;
}

export function LimitedToBeBoxSelectorIndicator({ url }: Props) {
  return (
    <div className="absolute left-0 top-0 w-full">
      <div className="mx-auto max-w-fit rounded-b-lg border border-t-0 border-solid border-gray-6 bg-transparent px-3 py-1">
        <a
          className="flex items-center gap-1 text-sm text-gray-6"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          <Icon icon={Briefcase} />
          <span>BE Feature</span>
        </a>
      </div>
    </div>
  );
}
