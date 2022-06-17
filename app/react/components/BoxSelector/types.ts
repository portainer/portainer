import type { FeatureId } from '@/portainer/feature-flags/enums';

export interface BoxSelectorOption<T> {
  id: string;
  icon: string;
  label: string;
  description: string;
  value: T;
  disabled?: () => boolean;
  tooltip?: () => string;
  feature?: FeatureId;
}
