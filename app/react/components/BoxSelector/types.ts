import type { FeatureId } from '@/portainer/feature-flags/enums';

import { IconProps } from '@@/Icon';

export interface BoxSelectorOption<T> extends IconProps {
  id: string;
  label: string;
  description: string;
  value: T;
  disabled?: () => boolean;
  tooltip?: () => string;
  feature?: FeatureId;
  hide?: boolean;
}
