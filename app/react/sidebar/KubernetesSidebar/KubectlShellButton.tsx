import { Terminal } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { baseHref } from '@/portainer/helpers/pathHelper';

import { Button } from '@@/buttons';

import { useSidebarState } from '../useSidebarState';
import { SidebarTooltip } from '../SidebarItem/SidebarTooltip';

interface Props {
  environmentId: EnvironmentId;
}
export function KubectlShellButton({ environmentId }: Props) {
  const { isOpen: isSidebarOpen } = useSidebarState();

  const button = (
    <Button
      color="primary"
      size="small"
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
    </>
  );

  function handleOpen() {
    const url = window.location.origin + baseHref();
    window.open(
      `${url}#!/${environmentId}/kubernetes/kubectl-shell`,
      // give the window a unique name so that more than one can be opened
      `kubectl-shell-${environmentId}-${uuidv4()}`,
      'width=800,height=600'
    );
  }
}
