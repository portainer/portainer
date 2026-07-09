import { useQueries, UseQueryResult } from '@tanstack/react-query';

import { SourceDetail, sourceOptions } from '../../sources/queries/useSource';
import { WorkflowArtifact } from '../types';

export type SourceQueryResult = UseQueryResult<SourceDetail>;

export interface WorkflowSourceQuery {
  sourceId: number;
  query: SourceQueryResult;
}

export type WorkflowSourcesResult = WorkflowSourceQuery[];

/**
 * Resolves every sourceId referenced across an artifact list's files[], deduped.
 */
export function useWorkflowSources(
  artifacts: WorkflowArtifact[]
): WorkflowSourcesResult {
  const sourceIds = [
    ...new Set(
      artifacts
        .flatMap((artifact) => artifact.files)
        .map((file) => file.sourceId)
    ),
  ];

  const queries = useQueries({
    queries: sourceIds.map((id) => sourceOptions(id)),
  });

  return sourceIds.map((sourceId, index) => ({
    sourceId,
    query: queries[index],
  }));
}
