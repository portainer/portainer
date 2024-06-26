import { getSettings } from './queries/useSettings';

export async function getGlobalDeploymentOptions() {
  const settings = await getSettings();
  return settings.GlobalDeploymentOptions;
}
