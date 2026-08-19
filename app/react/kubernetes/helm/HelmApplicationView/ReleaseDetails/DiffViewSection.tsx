import { AutomationTestingProps } from '@/types';

import { DiffViewer } from '@@/CodeEditor/DiffViewer';
import { Loading } from '@@/Widget';
import { Alert } from '@@/Alert';

import { CompareRevisionNumberFetched, SelectedRevisionNumber } from './types';

interface Props extends AutomationTestingProps {
  isCompareReleaseLoading: boolean;
  isCompareReleaseError: boolean;
  compareRevisionNumberFetched?: CompareRevisionNumberFetched;
  selectedRevisionNumber: SelectedRevisionNumber;
  newText: string;
  originalText: string;
  id: string;
}

export function DiffViewSection({
  isCompareReleaseLoading,
  isCompareReleaseError,
  compareRevisionNumberFetched,
  selectedRevisionNumber,
  newText,
  originalText,
  id,
  'data-cy': dataCy,
}: Props) {
  if (isCompareReleaseLoading) {
    return <Loading />;
  }

  if (isCompareReleaseError) {
    return <Alert color="error">Error loading compare values</Alert>;
  }

  return (
    <DiffViewer
      newCode={newText}
      originalCode={originalText}
      id={id}
      data-cy={dataCy}
      placeholder="No values found"
      fileNames={{
        original: compareRevisionNumberFetched
          ? `Revision #${compareRevisionNumberFetched}`
          : 'No revision selected',
        modified: `Revision #${selectedRevisionNumber}`,
      }}
      className="mt-2"
      type="yaml"
      height="60vh"
    />
  );
}
