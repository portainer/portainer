import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { useCurrentStateAndParams } from '@uirouter/react';

import { useSystemVersion } from '@/react/portainer/system/useSystemVersion';

import headerStyles from '../HeaderTitle.module.css';
import './ContextHelp.css';

export function ContextHelp() {
  const docsUrl = useDocsUrl();

  return (
    <div className={headerStyles.menuButton}>
      <a
        href={docsUrl}
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
        data-cy="context-help-button"
      >
        <HelpCircle className="lucide" />
      </a>
    </div>
  );
}

export function useDocsUrl(doc?: string): string {
  const { state } = useCurrentStateAndParams();
  const versionQuery = useSystemVersion();

  if (!doc && !state) {
    return '';
  }

  let url = 'https://docs.portainer.io/';
  if (versionQuery.data) {
    let { ServerVersion } = versionQuery.data;
    if (ServerVersion[0] === 'v') {
      ServerVersion = ServerVersion.substring(1);
    }

    const parts = ServerVersion.split('.');
    if (parts.length >= 2) {
      const version = parts.slice(0, 2).join('.');
      url += `v/${version}`;
    }
  }

  if (doc) {
    return url + doc;
  }

  const { data } = state;
  if (
    data &&
    typeof data === 'object' &&
    'docs' in data &&
    typeof data.docs === 'string'
  ) {
    return url + data.docs;
  }

  return url;
}
