import { type LucideIcon, Box, GitBranch, Package } from 'lucide-react';

export type SourceStatus =
  | 'healthy'
  | 'error'
  | 'syncing'
  | 'paused'
  | 'unknown';
export type SourceType = 'git' | 'helm' | 'oci';

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  url: string;
  status: SourceStatus;
  error?: string;
  provider?: string;
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
