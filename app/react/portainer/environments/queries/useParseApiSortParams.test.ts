import { renderHook } from '@testing-library/react-hooks';
import { describe, expect, it } from 'vitest';

import {
  EnvironmentStatus,
  EnvironmentType,
  PlatformType,
} from '@/react/portainer/environments/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';

import { useParseSortGroupApiParams } from './useParseApiSortParams';

const groups: EnvironmentGroup[] = [
  { Id: 1, Name: 'Unassigned' } as EnvironmentGroup,
  { Id: 2, Name: 'Production' } as EnvironmentGroup,
];

describe('useParseSortGroupApiParams', () => {
  it('returns empty params when no filter is selected', () => {
    const { result } = renderHook(() =>
      useParseSortGroupApiParams(null, 'Health', groups)
    );
    expect(result.current).toEqual({});
  });

  describe('Health sort', () => {
    it('maps Up to status=[Up]', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('Up', 'Health', groups)
      );
      expect(result.current).toEqual({ status: [EnvironmentStatus.Up] });
    });

    it('maps Down to status=[Down]', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('Down', 'Health', groups)
      );
      expect(result.current).toEqual({ status: [EnvironmentStatus.Down] });
    });

    it('maps Outdated to outdated=true (no status)', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('Outdated', 'Health', groups)
      );
      expect(result.current).toEqual({ outdated: true });
    });

    it('maps Heartbeat to edge types + status=[Up] so backend returns only edge envs with a valid heartbeat', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('Heartbeat', 'Health', groups)
      );
      expect(result.current).toEqual({
        types: [
          EnvironmentType.EdgeAgentOnDocker,
          EnvironmentType.EdgeAgentOnKubernetes,
        ],
        status: [EnvironmentStatus.Up],
      });
    });

    it('returns a fresh types array (not the shared EdgeTypes tuple) for each call', () => {
      const { result: first } = renderHook(() =>
        useParseSortGroupApiParams('Heartbeat', 'Health', groups)
      );
      const { result: second } = renderHook(() =>
        useParseSortGroupApiParams('Heartbeat', 'Health', groups)
      );
      expect(first.current.types).not.toBe(second.current.types);
      expect(first.current.types).toEqual(second.current.types);
    });
  });

  describe('Group sort', () => {
    it('maps Unassigned to groupIds=[1]', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('1', 'Group', groups)
      );
      expect(result.current).toEqual({ groupIds: [1] });
    });

    it('maps a named group to that group id', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('2', 'Group', groups)
      );
      expect(result.current).toEqual({ groupIds: [2] });
    });

    it('returns empty params when the group id cannot be resolved', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('99', 'Group', groups)
      );
      expect(result.current).toEqual({});
    });
  });

  describe('Platform sort', () => {
    it('maps Docker to platformTypes=[Docker] and clears types', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('Docker', 'Platform', groups)
      );
      expect(result.current).toEqual({
        types: [],
        platformTypes: [PlatformType.Docker],
      });
    });

    it('returns empty platformTypes for unknown platforms', () => {
      const { result } = renderHook(() =>
        useParseSortGroupApiParams('Unknown', 'Platform', groups)
      );
      expect(result.current).toEqual({
        types: [],
        platformTypes: [],
      });
    });
  });
});
