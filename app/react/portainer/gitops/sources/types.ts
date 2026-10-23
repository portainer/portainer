import { type LucideIcon, Box, GitBranch, Package } from 'lucide-react';

import { WorkflowsStatus, SourcesSourceType } from '@api/types.gen';

export type SourceStatus = WorkflowsStatus;
export type SourceType = SourcesSourceType;

export interface Source {
  id: number;
  name: string;
  type: SourceType;
  url: string;
  status: SourceStatus;
  error?: string;
  usedBy: number;
  environments: number;
  lastSync: number;
}

export const SOURCE_TYPES: Record<
  SourceType,
  { label: string; icon: LucideIcon }
> = {
  git: { label: 'Git', icon: GitBranch },
  helm: { label: 'Helm', icon: Package },
  oci: { label: 'OCI', icon: Box },
};
