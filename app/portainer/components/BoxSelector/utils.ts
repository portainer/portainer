import { FeatureId } from '@/portainer/feature-flags/enums';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { IconProps } from '@@/Icon';

export function buildOption<T extends number | string>(
  id: string,
  icon: IconProps['icon'],
  label: string,
  description: string,
  value: T,
  feature?: FeatureId,
  featherIcon?: IconProps['featherIcon']
): BoxSelectorOption<T> {
  return { id, icon, label, description, value, feature, featherIcon };
}
