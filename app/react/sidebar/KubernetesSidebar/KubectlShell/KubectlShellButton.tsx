import { useState } from 'react';
import { createPortal } from 'react-dom';

import { EnvironmentId } from '@/portainer/environments/types';
import { useAnalytics } from '@/angulartics.matomo/analytics-services';

import { Button } from '@@/buttons';

import { KubeCtlShell } from './KubectlShell';
import styles from './KubectlShellButton.module.css';

interface Props {
  environmentId: EnvironmentId;
}
export function KubectlShellButton({ environmentId }: Props) {
  const [open, setOpen] = useState(false);
  const { trackEvent } = useAnalytics();
  return (
    <>
      <Button
        color="primary"
        size="xsmall"
        disabled={open}
        data-cy="k8sSidebar-shellButton"
        onClick={() => handleOpen()}
        className={styles.root}
      >
        <i className="fa fa-terminal space-right" /> kubectl shell
      </Button>

      {open &&
        createPortal(
          <KubeCtlShell
            environmentId={environmentId}
            onClose={() => setOpen(false)}
          />,
          document.body
        )}
    </>
  );

  function handleOpen() {
    setOpen(true);

    trackEvent('kubernetes-kubectl-shell', { category: 'kubernetes' });
  }
}
