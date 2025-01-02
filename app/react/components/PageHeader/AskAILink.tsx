import { BotMessageSquare } from 'lucide-react';
import clsx from 'clsx';

import headerStyles from './HeaderTitle.module.css';

const docsUrl = 'https://www.portainer.io/ask-the-ai';

export function AskAILink() {
  return (
    <div className={headerStyles.menuButton}>
      <a
        href={docsUrl}
        target="_blank"
        color="none"
        className={clsx(
          headerStyles.menuIcon,
          'icon-badge mr-1 !p-2 text-lg cursor-pointer',
          'text-gray-8',
          'th-dark:text-gray-warm-7'
        )}
        title="Ask AI"
        rel="noreferrer"
        data-cy="ask-ai-button"
      >
        <BotMessageSquare className="lucide" />
      </a>
    </div>
  );
}
