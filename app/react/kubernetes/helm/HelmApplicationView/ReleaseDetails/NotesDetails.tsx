import Markdown from 'markdown-to-jsx';
import { ReactNode } from 'react';

import { DiffViewMode } from './DiffControl';
import { DiffViewSection } from './DiffViewSection';
import { SelectedRevisionNumber, CompareRevisionNumberFetched } from './types';

type Props = {
  notes: string;
  selectedRevisionNumber: SelectedRevisionNumber;
  diffViewMode: DiffViewMode;
  compareNotes?: string;
  compareRevisionNumberFetched?: CompareRevisionNumberFetched;
  isCompareReleaseLoading: boolean;
  isCompareReleaseError: boolean;
  diffControl: ReactNode;
};

export function NotesDetails({
  notes,
  selectedRevisionNumber,
  diffViewMode,
  compareNotes,
  compareRevisionNumberFetched,
  isCompareReleaseLoading,
  isCompareReleaseError,
  diffControl,
}: Props) {
  return (
    <>
      {diffControl}
      {diffViewMode === 'view' ? (
        <Markdown className="mt-6 list-inside">{notes}</Markdown>
      ) : (
        <DiffViewSection
          isCompareReleaseLoading={isCompareReleaseLoading}
          isCompareReleaseError={isCompareReleaseError}
          compareRevisionNumberFetched={compareRevisionNumberFetched}
          selectedRevisionNumber={selectedRevisionNumber}
          newText={notes}
          originalText={compareNotes ?? ''}
          id="helm-notes-diff-viewer"
          data-cy="helm-notes-diff-viewer"
        />
      )}
    </>
  );
}
