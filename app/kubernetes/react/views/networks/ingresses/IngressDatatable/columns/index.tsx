import { useMemo } from 'react';

import { name } from './name';
import { type } from './type';
import { namespace } from './namespace';
import { className } from './className';
import { ingressRules } from './ingressRules';

export function useColumns() {
  return useMemo(() => [name, namespace, className, type, ingressRules], []);
}
