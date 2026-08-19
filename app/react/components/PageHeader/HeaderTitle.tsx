import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { ContextHelp } from '@@/PageHeader/ContextHelp';

import { useHeaderContext } from './HeaderContainer';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';
import { AskAILink } from './AskAILink';

export function HeaderTitle() {
  useHeaderContext();

  return (
    <div className="flex items-center">
      {isBE && <AskAILink />}
      <NotificationsMenu />
      <ContextHelp />
      {!window.ddExtension && <UserMenu />}
    </div>
  );
}
