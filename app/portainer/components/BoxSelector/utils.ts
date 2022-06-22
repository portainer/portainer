import { FeatureId } from '@/portainer/feature-flags/enums';

import { BoxSelectorOption } from '@@/BoxSelector/types';

export function buildOption<T extends number | string>(
  id: string,
  icon: string,
  label: string,
  description: string,
  value: T,
  feature?: FeatureId
): BoxSelectorOption<T> {
  return { id, icon, label, description, value, feature };
}
