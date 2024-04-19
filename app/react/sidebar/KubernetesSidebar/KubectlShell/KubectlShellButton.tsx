import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Terminal } from 'lucide-react';
import clsx from 'clsx';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useAnalytics } from '@/react/hooks/useAnalytics';

import { Button } from '@@/buttons';

import { useSidebarState } from '../../useSidebarState';
import { SidebarTooltip } from '../../SidebarItem/SidebarTooltip';

import { KubeCtlShell } from './KubectlShell';

interface Props {
  environmentId: EnvironmentId;
}
export function KubectlShellButton({ environmentId }: Props) {
  const { isOpen: isSidebarOpen } = useSidebarState();

  const [open, setOpen] = useState(false);
  const { trackEvent } = useAnalytics();

  const button = (
    <Button
      color="primary"
      size="small"
      disabled={open}
      data-cy="k8sSidebar-shellButton"
      onClick={() => handleOpen()}
      className={clsx('sidebar', !isSidebarOpen && '!p-1')}
      icon={Terminal}
    >
      {isSidebarOpen ? 'kubectl shell' : ''}
    </Button>
  );

  return (
    <>
      {!isSidebarOpen && (
        <SidebarTooltip
          content={
            <span className="whitespace-nowrap text-sm">Kubectl Shell</span>
          }
        >
          <span className="flex w-full justify-center">{button}</span>
        </SidebarTooltip>
      )}
      {isSidebarOpen && button}
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
