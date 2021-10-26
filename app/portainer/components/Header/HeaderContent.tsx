import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Link } from '@/portainer/components/Link';
import { useUser } from '@/portainer/hooks/useUser';

import controller from './HeaderContent.controller';
import styles from './HeaderContent.module.css';
import { useHeaderContext } from './Header';

export function HeaderContent({ children }: PropsWithChildren<unknown>) {
  useHeaderContext();
  const { user } = useUser();

  return (
    <div className="breadcrumb-links">
      <div className="pull-left">{children}</div>
      {user && (
        <div className="pull-right">
          <Link to="portainer.account" className={styles.myAccount}>
            <u>
              <i className="fa fa-wrench" aria-hidden="true" />
              my account
            </u>
          </Link>
          <Link
            to="portainer.logout"
            params={{ performApiLogout: true }}
            className={clsx('text-danger', styles.logOut)}
            data-cy="template-logoutButton"
          >
            <u>
              <i className="fa fa-sign-out-alt" aria-hidden="true" />
              log out
            </u>
          </Link>
        </div>
      )}
    </div>
  );
}

export const HeaderContentAngular = {
  requires: '^rdHeader',
  transclude: true,
  templateUrl: './HeaderContent.html',
  controller,
};
