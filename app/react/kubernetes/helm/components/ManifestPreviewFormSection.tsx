import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { FormSection } from '@@/form-components/FormSection';
import { CodeEditor } from '@@/CodeEditor';
import { DiffViewer } from '@@/CodeEditor/DiffViewer';
import { InlineLoader } from '@@/InlineLoader';
import { Alert } from '@@/Alert';
import { TextTip } from '@@/Tip/TextTip';

import { useHelmDryRun } from '../helmReleaseQueries/useHelmDryRun';
import { UpdateHelmReleasePayload } from '../types';

type Props = {
  payload: UpdateHelmReleasePayload;
  onChangePreviewValidation: (isValid: boolean) => void;
  currentManifest?: string; // only true on upgrade, not install
  title: string;
  environmentId: EnvironmentId;
};

export function ManifestPreviewFormSection({
  payload,
  currentManifest,
  onChangePreviewValidation,
  title,
  environmentId,
}: Props) {
  const debouncedPayload = useDebouncedValue(payload, 500);
  const manifestPreviewQuery = useHelmDryRun(environmentId, debouncedPayload);
  const [isFolded, setIsFolded] = useState(true);

  useEffect(() => {
    onChangePreviewValidation(!manifestPreviewQuery.isError);
  }, [manifestPreviewQuery.isError, onChangePreviewValidation]);

  if (
    !debouncedPayload.name ||
    !debouncedPayload.namespace ||
    !debouncedPayload.chart
  ) {
    return null;
  }

  // only show loading state or the error to keep the view simple (omitting the preview section because there is nothing to preview)
  if (manifestPreviewQuery.isInitialLoading) {
    return <InlineLoader>Generating manifest preview...</InlineLoader>;
  }

  if (manifestPreviewQuery.isError) {
    return (
      <Alert color="error" title="Error with Helm chart configuration">
        {manifestPreviewQuery.error?.message ||
          'Error generating manifest preview'}
      </Alert>
    );
  }

  return (
    <FormSection
      title={title}
      isFoldable
      defaultFolded={isFolded}
      setIsDefaultFolded={setIsFolded}
    >
      <ManifestPreview
        currentManifest={currentManifest}
        newManifest={manifestPreviewQuery.data?.manifest ?? ''}
      />
    </FormSection>
  );
}

function ManifestPreview({
  currentManifest,
  newManifest,
}: {
  currentManifest?: string;
  newManifest: string;
}) {
  if (!newManifest) {
    return <TextTip color="blue">No manifest preview available</TextTip>;
  }

  if (currentManifest) {
    return (
      <DiffViewer
        originalCode={currentManifest}
        newCode={newManifest}
        id="manifest-preview"
        data-cy="manifest-diff-preview"
        type="yaml"
      />
    );
  }

  return (
    <CodeEditor
      id="manifest-preview"
      value={newManifest}
      data-cy="manifest-preview"
      type="yaml"
      readonly
      showToolbar={false}
    />
  );
}
