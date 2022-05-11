import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Link } from '@/portainer/components/Link';
import { useUser } from '@/portainer/hooks/useUser';

import controller from './HeaderContent.controller';
import styles from './HeaderContent.module.css';
import { useHeaderContext } from './HeaderContainer';

export function HeaderContent({ children }: PropsWithChildren<unknown>) {
  useHeaderContext();
  const { user } = useUser();

  return (
    <div className="breadcrumb-links">
      <div className="pull-left">{children}</div>
      {user && !window.ddExtension && (
        <div className={clsx('pull-right', styles.userLinks)}>
          <Link to="portainer.account" className={styles.link}>
            <i
              className={clsx('fa fa-wrench', styles.linkIcon)}
              aria-hidden="true"
            />
            <span className={styles.linkText}>my account</span>
          </Link>
          <Link
            to="portainer.logout"
            params={{ performApiLogout: true }}
            className={clsx('text-danger', styles.link)}
            data-cy="template-logoutButton"
          >
            <i
              className={clsx('fa fa-sign-out-alt', styles.linkIcon)}
              aria-hidden="true"
            />
            <span className={styles.linkText}>log out</span>
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
