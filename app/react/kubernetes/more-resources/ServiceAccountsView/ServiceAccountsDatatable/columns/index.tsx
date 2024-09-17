import { name } from './name';
import { namespace } from './namespace';
import { created } from './created';

export function useColumns() {
  return [name, namespace, created];
}
