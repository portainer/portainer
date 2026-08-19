import { useEffect } from 'react';

import { useStackFile } from '@/react/common/stacks/queries/useStackFile';
import { Stack } from '@/react/common/stacks/types';

export function useVersionedStackFile({
  stackId,
  version,
  onLoad,
}: {
  stackId: Stack['Id'];
  version?: number;
  onLoad(content: string): void;
}) {
  const fileQuery = useStackFile(stackId, { version }, { enabled: !!version });
  useEffect(() => {
    if (fileQuery.isSuccess && fileQuery.data?.StackFileContent) {
      onLoad(fileQuery.data.StackFileContent);
    }
  }, [
    fileQuery.isSuccess,
    fileQuery.data?.StackFileContent,
    onLoad,
    version, // reload on version change
  ]);

  return {
    isLoading: fileQuery.isLoading,
    content: fileQuery.data?.StackFileContent,
  };
}
