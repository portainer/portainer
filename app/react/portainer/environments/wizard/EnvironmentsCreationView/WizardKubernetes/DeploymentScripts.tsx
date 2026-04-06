import { Info } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { getAgentShortVersion } from '@/portainer/views/endpoints/helpers';
import { useAgentDetails } from '@/react/portainer/environments/queries/useAgentDetails';

import { CopyButton } from '@@/buttons/CopyButton';
import { Code } from '@@/Code';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { NavTabs } from '@@/NavTabs';
import { Icon } from '@@/Icon';
import { NavContainer } from '@@/NavTabs/NavContainer';

export function DeploymentScripts({
  deployType,
  setDeployType,
}: {
  deployType: string;
  setDeployType: (id: string) => void;
}) {
  const { t } = useTranslation();

  const deployments = [
    {
      id: 'k8sLoadBalancer',
      label: t('wizard_kube_scripts.via_load_balancer'),
      command: kubeLoadBalancerCommand,
      showAgentSecretMessage: true,
    },
    {
      id: 'k8sNodePort',
      label: t('wizard_kube_scripts.via_node_port'),
      command: kubeNodePortCommand,
      showAgentSecretMessage: true,
    },
  ];

  const agentDetailsQuery = useAgentDetails();

  if (!agentDetailsQuery) {
    return null;
  }

  const { agentVersion, agentSecret } = agentDetailsQuery;

  const options = deployments.map((c) => {
    const code = c.command(agentVersion);

    return {
      id: c.id,
      label: c.label,
      children: (
        <DeployCode
          agentSecret={agentSecret}
          showAgentSecretMessage={c.showAgentSecretMessage}
          code={code}
        />
      ),
    };
  });

  return (
    <>
      <FormSectionTitle>{t('wizard_kube_scripts.information')}</FormSectionTitle>

      <div className="form-group">
        <span className="col-sm-12 text-muted small">
          {t('wizard_kube_scripts.deploy_agent_info')}
        </span>
      </div>

      <NavContainer>
        <NavTabs
          options={options}
          onSelect={(id: string) => setDeployType(id)}
          selectedId={deployType}
        />
      </NavContainer>
    </>
  );
}

function kubeNodePortCommand(agentVersion: string) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `kubectl apply -f https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-nodeport.yaml`;
}

function kubeLoadBalancerCommand(agentVersion: string) {
  const agentShortVersion = getAgentShortVersion(agentVersion);

  return `kubectl apply -f https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-lb.yaml`;
}

interface LoadBalancerProps {
  agentSecret?: string;
  showAgentSecretMessage?: boolean;
  code: string;
}

function DeployCode({
  agentSecret,
  showAgentSecretMessage,
  code,
}: LoadBalancerProps) {
  const { t } = useTranslation();

  return (
    <>
      {showAgentSecretMessage && agentSecret && (
        <p className="text-muted small my-6">
          <Icon icon={Info} mode="primary" className="mr-1" />
          {t('wizard_kube_scripts.agent_secret_note')}
          <code>{agentSecret}</code>. {t('wizard_kube_scripts.update_manifest')}
        </p>
      )}
      <Code>{code}</Code>
      <div className="mt-2">
        <CopyButton copyText={code} data-cy="copy-deploy-agent-command-button">
          {t('wizard_env.copy_command')}
        </CopyButton>
      </div>
    </>
  );
}
