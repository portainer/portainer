import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

import { getDocURL } from '@@/PageHeader/ContextHelp/docURLs';

import headerStyles from '../HeaderTitle.module.css';

import './ContextHelp.css';

export function ContextHelp() {
  const docURL = getDocURL();

  return (
    <div className={headerStyles.menuButton}>
      <a
        href={docURL}
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
