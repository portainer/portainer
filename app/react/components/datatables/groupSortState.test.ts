import { describe, it, expect, vi } from 'vitest';

import { buildGroupSortExtras } from './groupSortState';

describe('buildGroupSortExtras — summary bar scenarios', () => {
  it('switching to status sort clears status set via summary bar', () => {
    // sort='name', status='error' (set via summary bar) → setSortBy('status')
    // → status cleared (entering grouped-by-status mode resets the filter)
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'name', status: 'error' }, setUrlState);
    extras.setSortBy('status', false);
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'status',
      order: 'asc',
      page: 0,
      status: null,
    });
  });

  it('switching to a different sort preserves status set via summary bar', () => {
    // sort='name', status='error' (set via summary bar) → setSortBy('type')
    // → status persists (cross-dimension, type cleared, status untouched)
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'name', status: 'error' }, setUrlState);
    extras.setSortBy('type', false);
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'type',
      order: 'asc',
      page: 0,
      type: null,
    });
  });
});

describe('buildGroupSortExtras — sort bar group scenarios', () => {
  it('leaving status sort clears status set via sort bar group', () => {
    // sort='status', status='error' (set via sort bar group) → setSortBy('name')
    // → status cleared (leaving grouped-by-status mode)
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'status', status: 'error' }, setUrlState);
    extras.setSortBy('name', false);
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'name',
      order: 'asc',
      page: 0,
      status: null,
    });
  });

  it('clicking a sort bar group value sets sort and filter together', () => {
    // sort='name' → setGroupFilter('status', 'error')
    // → sort=status, status=error
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'name' }, setUrlState);
    extras.setGroupFilter({ group: 'status', groupValue: 'error' });
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'status',
      order: 'asc',
      page: 0,
      status: 'error',
    });
  });

  it('deselecting a sort bar group value keeps sort, clears filter, changes order', () => {
    // sort='status', status='error' (set via sort bar group) → setGroupFilter('status', null)
    // → sort stays status, status cleared, order toggles
    const setUrlState = vi.fn();
    const extras = makeExtras(
      { sort: 'status', status: 'error', order: 'asc' },
      setUrlState
    );
    extras.setGroupFilter({ group: 'status', groupValue: null });
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'status',
      order: 'desc',
      page: 0,
      status: null,
    });
  });
});

describe('buildGroupSortExtras — cross-dimension AND filter scenarios', () => {
  it('status set via summary bar persists when switching to a different sort bar group option', () => {
    // sort='name', status='error' (set via summary bar) → setGroupFilter('type', 'stack')
    // → sort=type, type=stack, status=error preserved (AND filter)
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'name', status: 'error' }, setUrlState);
    extras.setGroupFilter({ group: 'type', groupValue: 'stack' });
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'type',
      order: 'asc',
      page: 0,
      type: 'stack',
    });
  });

  it('status set via summary bar persists through a second sort bar group switch, old group dimension clears', () => {
    // sort='type', type='stack', status='error' (set via summary bar, AND filter)
    // → setGroupFilter('platform', 'docker')
    // → sort=platform, type cleared, status still persists
    const setUrlState = vi.fn();
    const extras = makeExtrasWithPlatform(
      { sort: 'type', type: 'stack', status: 'error' },
      setUrlState
    );
    extras.setGroupFilter({ group: 'platform', groupValue: 'docker' });
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'platform',
      order: 'asc',
      page: 0,
      platform: 'docker',
      type: null,
    });
  });

  it('status set via sort bar group clears when switching to a different sort bar group option', () => {
    // sort='status', status='error' (set via sort bar group) → setGroupFilter('type', 'stack')
    // → status cleared (was the old sort dimension)
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'status', status: 'error' }, setUrlState);
    extras.setGroupFilter({ group: 'type', groupValue: 'stack' });
    expect(setUrlState).toHaveBeenCalledWith({
      sort: 'type',
      order: 'asc',
      page: 0,
      type: 'stack',
      status: null,
      groupBy: null,
      groupFilter: null,
    });
  });
});

describe('buildGroupSortExtras — override scenarios', () => {
  it('summary bar overrides status set via sort bar group (last write wins)', () => {
    // setStatus is handled by the view, not buildGroupSortExtras.
    // Verify that groupFilter reflects the current URL status when sort=status.
    const extras = makeExtras({ sort: 'status', status: 'healthy' });
    expect(extras.groupFilter).toBe('healthy');
  });

  it('toggling sort direction preserves the active sort bar group filter', () => {
    const setUrlState = vi.fn();
    const extras = makeExtras({ sort: 'status', status: 'error' }, setUrlState);
    extras.setSortBy('status', true);
    expect(setUrlState).toHaveBeenCalledWith({
      groupBy: null,
      groupFilter: null,
      sort: 'status',
      order: 'desc',
      page: 0,
    });
  });
});

function makeExtras(
  urlState: {
    sort: string;
    status?: string | null;
    type?: string | null;
    order?: 'desc' | 'asc';
  },
  setUrlState = vi.fn()
) {
  const order = urlState.order || 'asc';
  return buildGroupSortExtras({
    urlState: { status: null, type: null, order, ...urlState },
    setUrlState,
    defaultSort: 'name',
    sortKeys: ['name', 'status', 'type'] as const,
    dimensions: [{ key: 'status' }, { key: 'type' }],
  });
}

function makeExtrasWithPlatform(
  urlState: {
    sort: string;
    status?: string | null;
    type?: string | null;
    platform?: string | null;
    order?: 'asc' | 'desc';
  },
  setUrlState = vi.fn()
) {
  const order = urlState.order || 'asc';
  return buildGroupSortExtras({
    urlState: { status: null, type: null, platform: null, order, ...urlState },
    setUrlState,
    defaultSort: 'name',
    sortKeys: ['name', 'status', 'type', 'platform'] as const,
    dimensions: [{ key: 'status' }, { key: 'type' }, { key: 'platform' }],
  });
}
