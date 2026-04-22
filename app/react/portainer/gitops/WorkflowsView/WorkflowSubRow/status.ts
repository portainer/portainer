import { Workflow, WorkflowStatus } from '../types';

const GIT_ERROR_PATTERNS = [
  /clone/i,
  /fetch/i,
  /pull/i,
  /repository/i,
  /authentication/i,
  /credential/i,
  /ssh/i,
  /unable to access/i,
  /could not read/i,
];

const ARTIFACT_ERROR_PATTERNS = [
  /parse/i,
  /yaml/i,
  /stack config file/i,
  /failed to get stack file/i,
  /bind-mount/i,
  /privileged mode/i,
  /pid host/i,
  /device mapping/i,
  /sysctl/i,
  /security-opt/i,
  /container capabilities/i,
];

function classifyErrorPhase(msg: string): 'source' | 'artifact' | 'target' {
  if (GIT_ERROR_PATTERNS.some((p) => p.test(msg))) return 'source';
  if (ARTIFACT_ERROR_PATTERNS.some((p) => p.test(msg))) return 'artifact';
  return 'target';
}

export function deriveSubRowStatuses(item: Workflow): {
  source: WorkflowStatus;
  artifact: WorkflowStatus;
  target: WorkflowStatus;
} {
  if (item.status === 'paused') {
    return { source: 'healthy', artifact: 'healthy', target: 'paused' };
  }
  if (item.status !== 'error') {
    return { source: item.status, artifact: item.status, target: item.status };
  }
  const phase = classifyErrorPhase(item.statusMessage ?? '');
  if (phase === 'source') {
    return { source: 'error', artifact: 'unknown', target: 'unknown' };
  }
  if (phase === 'artifact') {
    return { source: 'healthy', artifact: 'error', target: 'unknown' };
  }
  return { source: 'healthy', artifact: 'healthy', target: 'error' };
}
