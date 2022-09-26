import { HelpCircle } from 'react-feather';
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
          'icon-badge text-lg !p-2 mr-1',
          'text-gray-8',
          'th-dark:text-gray-warm-7'
        )}
        title="Help"
      >
        <HelpCircle className="feather" onClick={onHelpClick} />
      </div>
    </div>
  );
}
