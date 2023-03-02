import { useSettings } from '@/react/portainer/settings/queries';
import { useSystemStatus } from '@/react/portainer/system/useSystemStatus';

export function useAgentDetails() {
  const settingsQuery = useSettings();

  const versionQuery = useSystemStatus({ select: (status) => status.Version });

  if (!versionQuery.isSuccess || !settingsQuery.isSuccess) {
    return null;
  }

  const agentVersion = versionQuery.data;

  return {
    agentVersion,
    agentSecret: settingsQuery.data.AgentSecret,
  };
}
