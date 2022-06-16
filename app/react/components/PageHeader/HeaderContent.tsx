import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { useUser } from '@/portainer/hooks/useUser';

import { Link } from '@@/Link';

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
