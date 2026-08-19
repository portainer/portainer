import { describe, it, expect } from 'vitest';

import {
  mockWorkflowHealthy,
  mockWorkflowTargetError,
  mockWorkflowEdgeMixed,
  mockWorkflowMultiArtifact,
  mockWorkflowEmpty,
} from './test-utils/workflow.mock';
import {
  WorkflowPhaseStatus,
  WorkflowStatus,
  WorkflowStatusObject,
} from './types';
import {
  effectiveWorkflowStatus,
  worstPhaseStatus,
  computeTargetRollup,
} from './status';

describe('effectiveWorkflowStatus', () => {
  describe('uniform phases', () => {
    it.each<WorkflowStatus>([
      'error',
      'syncing',
      'paused',
      'healthy',
      'unknown',
    ])('all phases %s → %s', (statusType) => {
      const status = makeWorkflowStatus(
        makePhase(statusType),
        makePhase(statusType),
        makePhase(statusType)
      );
      expect(effectiveWorkflowStatus({ status }).status).toBe(statusType);
    });
  });

  describe('priority order', () => {
    it('error beats syncing and healthy', () => {
      const status = makeWorkflowStatus(
        makePhase('error'),
        makePhase('syncing'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus({ status }).status).toBe('error');
    });

    it('syncing beats paused and healthy', () => {
      const status = makeWorkflowStatus(
        makePhase('paused'),
        makePhase('syncing'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus({ status }).status).toBe('syncing');
    });

    it('paused beats healthy and unknown', () => {
      const status = makeWorkflowStatus(
        makePhase('healthy'),
        makePhase('unknown'),
        makePhase('paused')
      );
      expect(effectiveWorkflowStatus({ status }).status).toBe('paused');
    });
  });

  describe('error message', () => {
    it('includes error from the winning phase', () => {
      const status = makeWorkflowStatus(
        makePhase('error', 'git clone failed'),
        makePhase('healthy'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus({ status })).toEqual({
        status: 'error',
        error: 'git clone failed',
      });
    });

    it('no error when winning phase has no error', () => {
      const status = makeWorkflowStatus(
        makePhase('syncing'),
        makePhase('healthy'),
        makePhase('healthy')
      );
      expect(effectiveWorkflowStatus({ status }).error).toBeUndefined();
    });
  });
});

describe('worstPhaseStatus', () => {
  it('returns the sole phase for a single-element list', () => {
    expect(worstPhaseStatus([makePhase('syncing')]).status).toBe('syncing');
  });

  it('picks the highest-priority phase among many', () => {
    const phases = [
      makePhase('unknown'),
      makePhase('healthy'),
      makePhase('paused'),
      makePhase('syncing'),
      makePhase('error'),
    ];
    expect(worstPhaseStatus(phases).status).toBe('error');
  });

  it('carries the error message of the winning phase', () => {
    const phases = [makePhase('healthy'), makePhase('error', 'deploy failed')];
    expect(worstPhaseStatus(phases)).toEqual({
      status: 'error',
      error: 'deploy failed',
    });
  });

  it('is stable when all phases tie on priority', () => {
    const phases = [makePhase('healthy'), makePhase('healthy')];
    expect(worstPhaseStatus(phases).status).toBe('healthy');
  });
});

describe('computeTargetRollup', () => {
  it('reports success and full sync for an all-healthy stack workflow', () => {
    expect(computeTargetRollup(mockWorkflowHealthy)).toEqual({
      synced: 1,
      total: 1,
      tone: 'success',
    });
  });

  it('reports danger when the single stack target errored', () => {
    expect(computeTargetRollup(mockWorkflowTargetError)).toEqual({
      synced: 0,
      total: 1,
      tone: 'danger',
    });
  });

  it('counts one target per edge group and reports danger if any group errored', () => {
    expect(computeTargetRollup(mockWorkflowEdgeMixed)).toEqual({
      synced: 1,
      total: 2,
      tone: 'danger',
    });
  });

  it('reports warning (not danger) when a target is syncing rather than errored', () => {
    expect(computeTargetRollup(mockWorkflowMultiArtifact)).toEqual({
      synced: 1,
      total: 2,
      tone: 'warning',
    });
  });

  it('reports muted with zero counts for a zero-artifact workflow', () => {
    expect(computeTargetRollup(mockWorkflowEmpty)).toEqual({
      synced: 0,
      total: 0,
      tone: 'muted',
    });
  });
});

function makeWorkflowStatus(
  source: WorkflowPhaseStatus,
  artifact: WorkflowPhaseStatus,
  target: WorkflowPhaseStatus
): WorkflowStatusObject {
  return { source, artifact, target };
}

function makePhase(
  status: WorkflowStatus,
  error?: string
): WorkflowPhaseStatus {
  return { status, error };
}
