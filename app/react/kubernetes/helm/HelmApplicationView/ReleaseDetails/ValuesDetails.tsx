import { ReactNode } from 'react';

import { CodeEditor } from '@@/CodeEditor';

import { Values } from '../../types';

import { DiffViewMode } from './DiffControl';
import { DiffViewSection } from './DiffViewSection';
import { SelectedRevisionNumber, CompareRevisionNumberFetched } from './types';

interface Props {
  values?: Values;
  isUserSupplied: boolean;
  selectedRevisionNumber: SelectedRevisionNumber;
  diffViewMode: DiffViewMode;
  compareValues?: Values;
  compareRevisionNumberFetched?: CompareRevisionNumberFetched;
  isCompareReleaseLoading: boolean;
  isCompareReleaseError: boolean;
  diffControl: ReactNode;
}

export function ValuesDetails({
  values,
  isUserSupplied,
  selectedRevisionNumber,
  diffViewMode,
  compareValues,
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
          type="yaml"
          id="values-details-code-editor"
          data-cy="values-details-code-editor"
          value={
            isUserSupplied
              ? (values?.userSuppliedValues ?? '')
              : (values?.computedValues ?? '')
          }
          readonly
          fileName={`Revision #${selectedRevisionNumber}`}
          placeholder="No values found"
          height="60vh"
        />
      ) : (
        <DiffViewSection
          isCompareReleaseLoading={isCompareReleaseLoading}
          isCompareReleaseError={isCompareReleaseError}
          compareRevisionNumberFetched={compareRevisionNumberFetched}
          selectedRevisionNumber={selectedRevisionNumber}
          newText={
            isUserSupplied
              ? (values?.userSuppliedValues ?? '')
              : (values?.computedValues ?? '')
          }
          originalText={
            isUserSupplied
              ? (compareValues?.userSuppliedValues ?? '')
              : (compareValues?.computedValues ?? '')
          }
          id="values-details-diff-viewer"
          data-cy="values-details-diff-viewer"
        />
      )}
    </>
  );
}
