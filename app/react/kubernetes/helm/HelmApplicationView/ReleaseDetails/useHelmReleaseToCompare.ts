import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { HelmRelease } from '../../types';
import { useHelmRelease } from '../../helmReleaseQueries/useHelmRelease';

import { DiffViewMode } from './DiffControl';

/** useHelmReleaseToCompare is a hook that returns the release to compare to based on the diffViewMode, selectedRevisionNumber and selectedCompareRevisionNumber */
export function useHelmReleaseToCompare(
  release: HelmRelease,
  earliestRevisionNumber: number,
  latestRevisionNumber: number,
  diffViewMode: DiffViewMode,
  selectedRevisionNumber: number,
  selectedCompareRevisionNumber: number
) {
  const environmentId = useEnvironmentId();
  // the selectedCompareRevisionNumber is the number selected in the input field, but the compareRevisionNumber is the revision number of the release to compare to
  const compareRevisionNumber = getCompareReleaseVersion(
    diffViewMode,
    selectedRevisionNumber,
    selectedCompareRevisionNumber
  );
  const enabled =
    compareRevisionNumber <= latestRevisionNumber &&
    compareRevisionNumber >= earliestRevisionNumber;

  // a 1 hour stale time is nice because past releases are not likely to change
  const compareReleaseQuery = useHelmRelease(
    environmentId,
    release.name,
    release.namespace ?? '',
    {
      showResources: false,
      enabled,
      staleTime: 60 * 60 * 1000,
      revision: compareRevisionNumber,
    }
  );
  return {
    compareRelease: compareReleaseQuery.data,
    isCompareReleaseLoading: compareReleaseQuery.isInitialLoading,
    isCompareReleaseError: compareReleaseQuery.isError,
  };
}

// getCompareReleaseVersion is a helper function that returns the revision number that should be fetched based on the diffViewMode, selectedRevisionNumber and selectedCompareRevisionNumber
function getCompareReleaseVersion(
  diffViewMode: DiffViewMode,
  selectedRevisionNumber: number,
  selectedCompareRevisionNumber: number
) {
  if (diffViewMode === 'previous') {
    return selectedRevisionNumber - 1;
  }
  if (diffViewMode === 'specific') {
    return selectedCompareRevisionNumber;
  }
  return selectedRevisionNumber;
}
