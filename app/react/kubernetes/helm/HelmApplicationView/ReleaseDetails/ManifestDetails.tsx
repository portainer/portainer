import { ReactNode } from 'react';

import { CodeEditor } from '@@/CodeEditor';

import { DiffViewMode } from './DiffControl';
import { DiffViewSection } from './DiffViewSection';
import { SelectedRevisionNumber, CompareRevisionNumberFetched } from './types';

type Props = {
  manifest: string;
  selectedRevisionNumber: SelectedRevisionNumber;
  diffViewMode: DiffViewMode;
  compareManifest?: string;
  compareRevisionNumberFetched?: CompareRevisionNumberFetched;
  isCompareReleaseLoading: boolean;
  isCompareReleaseError: boolean;
  diffControl: ReactNode;
};

export function ManifestDetails({
  manifest,
  selectedRevisionNumber,
  diffViewMode,
  compareManifest,
  compareRevisionNumberFetched,
  isCompareReleaseLoading,
  isCompareReleaseError,
  diffControl,
}: Props) {
  return (
    <>
      {diffControl}
      {diffViewMode === 'view' ? (
        <CodeEditor
          id="helm-manifest"
          type="yaml"
          data-cy="helm-manifest"
          value={manifest}
          readonly
          fileName={`Revision #${selectedRevisionNumber}`}
          placeholder="No manifest found"
          height="60vh"
        />
      ) : (
        <DiffViewSection
          isCompareReleaseLoading={isCompareReleaseLoading}
          isCompareReleaseError={isCompareReleaseError}
          compareRevisionNumberFetched={compareRevisionNumberFetched}
          selectedRevisionNumber={selectedRevisionNumber}
          newText={manifest}
          originalText={compareManifest ?? ''}
          id="helm-manifest-diff-viewer"
          data-cy="helm-manifest-diff-viewer"
        />
      )}
    </>
  );
}
