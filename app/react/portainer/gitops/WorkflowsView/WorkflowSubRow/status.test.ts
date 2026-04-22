import { describe, it, expect } from 'vitest';

import { Workflow, WorkflowStatus } from '../types';

import { deriveSubRowStatuses } from './status';

function makeItem(status: WorkflowStatus, statusMessage?: string): Workflow {
  return {
    id: 1,
    name: 'test',
    type: 'stack',
    platform: 'dockerStandalone',
    status,
    statusMessage,
    target: { endpointId: 1 },
    creationDate: 0,
    lastSyncDate: 0,
  };
}

describe('deriveSubRowStatuses', () => {
  describe('paused', () => {
    it('returns healthy source/artifact and paused target', () => {
      expect(deriveSubRowStatuses(makeItem('paused'))).toEqual({
        source: 'healthy',
        artifact: 'healthy',
        target: 'paused',
      });
    });
  });

  describe('non-error statuses', () => {
    it.each<WorkflowStatus>(['healthy', 'syncing', 'unknown'])(
      'propagates %s to all three phases',
      (status) => {
        expect(deriveSubRowStatuses(makeItem(status))).toEqual({
          source: status,
          artifact: status,
          target: status,
        });
      }
    );
  });

  describe('error with git-related message', () => {
    it.each([
      'failed to clone repository',
      'could not fetch remote',
      'pull failed',
      'repository not found',
      'authentication failed',
      'invalid credential',
      'ssh: connect to host',
      'unable to access https://github.com',
      'could not read from remote repository',
    ])('classifies "%s" as source error', (msg) => {
      expect(deriveSubRowStatuses(makeItem('error', msg))).toEqual({
        source: 'error',
        artifact: 'unknown',
        target: 'unknown',
      });
    });
  });

  describe('error with artifact message', () => {
    it.each([
      'yaml: unmarshal errors',
      'stack config file is invalid: services must be a mapping',
      'failed to get stack file content',
      'bind-mount disabled for non administrator users',
      'privileged mode disabled for non administrator users',
      'pid host disabled for non administrator users',
      'device mapping disabled for non administrator users',
      'sysctl setting disabled for non administrator users',
      'security-opt setting disabled for non administrator users',
      'container capabilities disabled for non administrator users',
      'failed to parse compose file',
    ])('classifies "%s" as artifact error', (msg) => {
      expect(deriveSubRowStatuses(makeItem('error', msg))).toEqual({
        source: 'healthy',
        artifact: 'error',
        target: 'unknown',
      });
    });
  });

  describe('error with target message', () => {
    it.each([
      'container failed to start',
      'exit code 1',
      'out of memory',
      'OOMKilled',
      undefined,
    ])('classifies "%s" as target error', (msg) => {
      expect(deriveSubRowStatuses(makeItem('error', msg))).toEqual({
        source: 'healthy',
        artifact: 'healthy',
        target: 'error',
      });
    });
  });
});
