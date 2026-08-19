import { EnvironmentId } from '@/react/portainer/environments/types';

import { ButtonGroup } from '@@/buttons';

import { ContainerId } from '../../types';

import { StartButton } from './PrimaryActions/StartButton';
import { StopButton } from './PrimaryActions/StopButton';
import { KillButton } from './PrimaryActions/KillButton';
import { RestartButton } from './PrimaryActions/RestartButton';
import { PauseButton } from './PrimaryActions/PauseButton';
import { ResumeButton } from './PrimaryActions/ResumeButton';
import { RemoveButton } from './PrimaryActions/RemoveButton';

interface Props {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  isRunning: boolean;
  isPaused: boolean;
  isPortainer: boolean;
  onSuccess?(): void;
}

export function PrimaryActions({
  environmentId,
  containerId,
  nodeName,
  isRunning,
  isPaused,
  isPortainer,
  onSuccess = () => {},
}: Props) {
  return (
    <ButtonGroup>
      <StartButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isRunning={isRunning}
        isPortainer={isPortainer}
        onSuccess={onSuccess}
      />

      <StopButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isRunning={isRunning}
        isPortainer={isPortainer}
        onSuccess={onSuccess}
      />

      <KillButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isRunning={isRunning}
        isPortainer={isPortainer}
        onSuccess={onSuccess}
      />

      <RestartButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isRunning={isRunning}
        isPortainer={isPortainer}
        onSuccess={onSuccess}
      />

      <PauseButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isRunning={isRunning}
        isPaused={isPaused}
        isPortainer={isPortainer}
        onSuccess={onSuccess}
      />

      <ResumeButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isPaused={isPaused}
        isPortainer={isPortainer}
        onSuccess={onSuccess}
      />

      <RemoveButton
        environmentId={environmentId}
        containerId={containerId}
        nodeName={nodeName}
        isRunning={isRunning}
        isPortainer={isPortainer}
      />
    </ButtonGroup>
  );
}
