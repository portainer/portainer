import { useTranslation } from 'react-i18next';

import {
  ContainerEngine,
  Environment,
} from '@/react/portainer/environments/types';

import { TextTip } from '@@/Tip/TextTip';

import { DeploymentScripts } from './DeploymentScripts';
import { SocketForm } from './SocketForm';

interface Props {
  onCreate(environment: Environment): void;
}

export function SocketTab({ onCreate }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <TextTip color="orange" className="mb-2" inline={false}>
        {t('wizard_env.podman.socket_tab_notice')}
      </TextTip>

      <DeploymentScripts />

      <div className="mt-5">
        <SocketForm
          onCreate={onCreate}
          containerEngine={ContainerEngine.Podman}
        />
      </div>
    </>
  );
}
