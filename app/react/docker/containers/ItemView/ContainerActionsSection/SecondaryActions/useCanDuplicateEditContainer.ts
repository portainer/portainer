import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { isRegularUserRestricted } from './utils';

/**
 * Hook to determine if the duplicate/edit button should be displayed
 */
export function useCanDuplicateEditContainer({
  autoRemove,
  partOfSwarmService,
}: {
  autoRemove: boolean;
  partOfSwarmService: boolean;
}) {
  const environmentQuery = useCurrentEnvironment();
  const { isAdmin } = useIsEdgeAdmin();

  if (!environmentQuery.data) {
    return false;
  }

  const regularUserRestricted = isRegularUserRestricted(
    environmentQuery.data.SecuritySettings
  );

  return (
    !partOfSwarmService && !autoRemove && (isAdmin || !regularUserRestricted)
  );
}
