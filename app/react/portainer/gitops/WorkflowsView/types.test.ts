import { describe, it, expect } from 'vitest';

import {
  effectiveWorkflowStatus,
  Workflow,
  WorkflowPhaseStatus,
  WorkflowStatus,
} from './types';

function makePhase(
  status: WorkflowStatus,
  error?: string
): WorkflowPhaseStatus {
  return { status, error };
}

function makeWorkflow(
  source: WorkflowPhaseStatus,
  artifact: WorkflowPhaseStatus,
  target: WorkflowPhaseStatus
): Workflow {
  return {
    id: 1,
    name: 'test',
    type: 'stack',
    platform: 'dockerStandalone',
    status: { source, artifact, target },
    target: { endpointId: 1 },
    creationDate: 0,
    lastSyncDate: 0,
  };
}

describe('effectiveWorkflowStatus', () => {
  describe('uniform phases', () => {
    it.each<WorkflowStatus>([
      'error',
      'syncing',
      'paused',
      'healthy',
      'unknown',
    ])('all phases %s → %s', (status) => {
      const item = makeWorkflow(
        makePhase(status),
        makePhase(status),
        makePhase(status)
      );
      expect(effectiveWorkflowStatus(item).status).toBe(status);
    });
  });

  describe('priority order', () => {
    it('error beats syncing and healthy', () => {
      const item = makeWorkflow(
        makePhase('error'),
        makePhase('syncing'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus(item).status).toBe('error');
    });

    it('syncing beats paused and healthy', () => {
      const item = makeWorkflow(
        makePhase('paused'),
        makePhase('syncing'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus(item).status).toBe('syncing');
    });

    it('paused beats healthy and unknown', () => {
      const item = makeWorkflow(
        makePhase('healthy'),
        makePhase('unknown'),
        makePhase('paused')
      );
      expect(effectiveWorkflowStatus(item).status).toBe('paused');
    });
  });

  describe('error message', () => {
    it('includes error from the winning phase', () => {
      const item = makeWorkflow(
        makePhase('error', 'git clone failed'),
        makePhase('healthy'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus(item)).toEqual({
        status: 'error',
        error: 'git clone failed',
      });
    });

    it('no error when winning phase has no error', () => {
      const item = makeWorkflow(
        makePhase('syncing'),
        makePhase('healthy'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus(item).error).toBeUndefined();
    });
  });
});
