import { ResourceControlResponse } from '@/react/portainer/access-control/types';

interface AgentMetadata {
  NodeName: string;
}

export interface PortainerMetadata {
  ResourceControl?: ResourceControlResponse;
  Agent?: AgentMetadata;
}

export type PortainerResponse<T> = T & {
  Portainer?: PortainerMetadata;
  /**
   * will be true if the portainer is running in this resource
   */
  IsPortainer?: boolean;
};
