import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

import { getDocURL } from '@@/PageHeader/ContextHelp/docURLs';

import headerStyles from '../HeaderTitle.module.css';
import './ContextHelp.css';

export function ContextHelp() {
  function onHelpClick() {
    const docURL = getDocURL();
    window.open(docURL, '_blank');
  }

  return (
    <div className={clsx(headerStyles.menuButton)}>
      <div
        className={clsx(
          headerStyles.menuIcon,
          'menu-icon',
          'icon-badge mr-1 !p-2 text-lg',
          'text-gray-8',
          'th-dark:text-gray-warm-7'
        )}
        title="Help"
      >
        <HelpCircle className="lucide" onClick={onHelpClick} />
      </div>
    </div>
  );
}
