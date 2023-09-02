import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { useCurrentStateAndParams } from '@uirouter/react';

import headerStyles from '../HeaderTitle.module.css';
import './ContextHelp.css';

export function ContextHelp({
  url = '',
}: {
  /** relative url to https://docs.portainer.io/ */
  url?: string;
}) {
  const {
    state: { data },
  } = useCurrentStateAndParams();
  const docsUrl = url || getDocsUrl(data);
  return (
    <div className={headerStyles.menuButton}>
      <a
        href={`https://docs.portainer.io${docsUrl}`}
        target="_blank"
        color="none"
        className={clsx(
          headerStyles.menuIcon,
          'menu-icon',
          'icon-badge mr-1 !p-2 text-lg',
          'text-gray-8',
          'th-dark:text-gray-warm-7'
        )}
        title="Help"
        rel="noreferrer"
      >
        <HelpCircle className="lucide" />
      </a>
    </div>
  );
}

function getDocsUrl(data: unknown) {
  if (
    data &&
    typeof data === 'object' &&
    'docs' in data &&
    typeof data.docs === 'string'
  ) {
    return data.docs;
  }

  return undefined;
}
