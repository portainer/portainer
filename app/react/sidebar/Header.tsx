import { Link } from '@/portainer/components/Link';
import defaultLogo from '@/assets/images/logo.png';

import styles from './Header.module.css';
import { useSidebarState } from './useSidebarState';

interface Props {
  logo?: string;
}

export function Header({ logo }: Props) {
  const { toggle } = useSidebarState();

  return (
    <div className={styles.root}>
      <Link to="portainer.home" data-cy="portainerSidebar-homeImage">
        <img
          src={logo || defaultLogo}
          className="img-responsive logo"
          alt={!logo ? 'Portainer' : ''}
        />
      </Link>
      {toggle && (
        <button
          type="button"
          onClick={() => toggle()}
          className={styles.toggleButton}
          aria-label="Toggle Sidebar"
          title="Toggle Sidebar"
        >
          <i className="glyphicon glyphicon-transfer" />
        </button>
      )}
    </div>
  );
}
