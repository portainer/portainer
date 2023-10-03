import { NetworkId } from '../../networks/types';
import { ContainerStatus } from '../types';

export interface Filters {
  label?: string[];
  network?: NetworkId[];
  status?: ContainerStatus[];
}
