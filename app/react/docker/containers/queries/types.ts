import { NetworkId } from '../../networks/types';
import { ContainerStatus } from '../types';

export interface Filters {
  label?: string[];
  name?: string[];
  network?: NetworkId[];
  status?: ContainerStatus[];
}

export type ContainerProcesses = {
  Processes: Array<Array<string>>;
  Titles: Array<string>;
};
