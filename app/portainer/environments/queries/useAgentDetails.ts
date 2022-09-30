import { useStatus } from '@/portainer/services/api/status.service';
import { useSettings } from '@/react/portainer/settings/queries';

export function useAgentDetails() {
  const settingsQuery = useSettings((settings) => settings.AgentSecret);

  const versionQuery = useStatus((status) => status.Version);

  if (!versionQuery.isSuccess || !settingsQuery.isSuccess) {
    return null;
  }

  const agentVersion = versionQuery.data;
  const agentSecret = settingsQuery.data;

  return { agentVersion, agentSecret };
}
