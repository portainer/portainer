import { useState } from 'react';
import { Download } from 'lucide-react';

import { Environment } from '@/react/portainer/environments/types';
import { isKubernetesEnvironment } from '@/react/portainer/environments/utils';
import { Query } from '@/react/portainer/environments/queries/useEnvironmentList';

import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { KubeconfigPrompt } from './KubeconfigPrompt';

import '@reach/dialog/styles.css';

export interface Props {
  environments: Environment[];
  envQueryParams: Query;
}
export function KubeconfigButton({ environments, envQueryParams }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const kubeEnvs = environments.filter((env) =>
    isKubernetesEnvironment(env.Type)
  );

  const isHttp = window.location.protocol === 'http:';
  const noKubeEnvs = kubeEnvs.length === 0;
  const isDisabled = noKubeEnvs || isHttp;

  let tooltipMessage = '';
  if (isHttp) {
    tooltipMessage =
      'Kubeconfig download is not available when Portainer is accessed via HTTP. Please use HTTPS';
  } else if (noKubeEnvs) {
    tooltipMessage = 'No Kubernetes environments detected';
  }

  const button = (
    <Button
      onClick={handleClick}
      data-cy="download-kubeconfig-button"
      size="medium"
      className="!m-0"
      icon={Download}
      disabled={isDisabled}
      color="light"
    >
      Kubeconfig
    </Button>
  );

  return (
    <>
      {isDisabled ? (
        <TooltipWithChildren message={tooltipMessage}>
          <span className="!m-0">{button}</span>
        </TooltipWithChildren>
      ) : (
        button
      )}
      {prompt()}
    </>
  );

  function handleClick() {
    if (!environments) {
      return;
    }

    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function prompt() {
    return (
      isOpen && (
        <KubeconfigPrompt
          envQueryParams={envQueryParams}
          onClose={handleClose}
          selectedItems={kubeEnvs.map((env) => env.Id)}
        />
      )
    );
  }
}
