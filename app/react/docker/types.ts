import { ResourceControlResponse } from '@/react/portainer/access-control/types';

interface AgentMetadata {
  NodeName: string;
}

export interface PortainerMetadata {
  ResourceControl?: ResourceControlResponse;
  Agent?: AgentMetadata;
}
