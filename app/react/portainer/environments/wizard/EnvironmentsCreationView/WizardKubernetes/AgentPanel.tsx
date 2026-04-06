import { useState } from 'react';

import { Environment } from '@/react/portainer/environments/types';

import { AgentForm } from '../shared/AgentForm';

import { DeploymentScripts } from './DeploymentScripts';

interface Props {
  onCreate(environment: Environment): void;
}

export function AgentPanel({ onCreate }: Props) {
  const [deployType, setDeployType] = useState('k8sLoadBalancer');
  const defaultPort = deployType === 'k8sNodePort' ? '30778' : '9001';
  return (
    <>
      <DeploymentScripts
        deployType={deployType}
        setDeployType={setDeployType}
      />

      <div className="mt-5">
        {' '}
        <AgentForm onCreate={onCreate} envDefaultPort={defaultPort} />
      </div>
    </>
  );
}
