import { ReactNode } from 'react';

import type { FeatureId } from '@/react/portainer/feature-flags/enums';

import { IconProps } from '@@/Icon';

export type Value = number | string | boolean;

export interface BoxSelectorOption<T extends Value> extends IconProps {
  readonly id: string;
  readonly label: string;
  readonly description?: ReactNode;
  readonly value: T;
  readonly disabled?: () => boolean;
  readonly tooltip?: () => string;
  readonly feature?: FeatureId;
  readonly disabledWhenLimited?: boolean;
  readonly hide?: boolean;
  readonly iconType?: 'raw' | 'badge' | 'logo';
}
