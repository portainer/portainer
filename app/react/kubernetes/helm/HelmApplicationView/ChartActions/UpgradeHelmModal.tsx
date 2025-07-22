import { useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { withReactQuery } from '@/react-tools/withReactQuery';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ChartVersion } from '@/react/kubernetes/helm/helmChartSourceQueries/useHelmRepoVersions';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Modal, OnSubmit, openModal } from '@@/modals';
import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { WidgetTitle } from '@@/Widget';
import { Checkbox } from '@@/form-components/Checkbox';
import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';

import { UpdateHelmReleasePayload } from '../../types';
import { HelmValuesInput } from '../../components/HelmValuesInput';
import { useHelmChartValues } from '../../helmChartSourceQueries/useHelmChartValues';
import { ManifestPreviewFormSection } from '../../components/ManifestPreviewFormSection';

interface Props {
  onSubmit: OnSubmit<UpdateHelmReleasePayload>;
  helmReleaseInitialValues: UpdateHelmReleasePayload;
  releaseManifest: string;
  versions: ChartVersion[];
  chartName: string;
  environmentId: EnvironmentId;
}

export function UpgradeHelmModal({
  helmReleaseInitialValues,
  releaseManifest,
  versions,
  onSubmit,
  chartName,
  environmentId,
}: Props) {
  const versionOptions: Option<ChartVersion>[] = versions.map((version) => {
    const repo =
      helmReleaseInitialValues.repo === version.Repo ? version.Repo : '';
    const isCurrentVersion =
      version.AppVersion === helmReleaseInitialValues.appVersion &&
      version.Version === helmReleaseInitialValues.version;

    const label = `${repo}@${version.Version}${
      isCurrentVersion ? ' (current)' : ''
    }`;

    return {
      repo,
      label,
      value: version,
    };
  });

  const defaultVersion =
    versionOptions.find(
      (v) =>
        v.value.AppVersion === helmReleaseInitialValues.appVersion &&
        v.value.Version === helmReleaseInitialValues.version &&
        v.value.Repo === helmReleaseInitialValues.repo
    )?.value || versionOptions[0]?.value;
  const [version, setVersion] = useState<ChartVersion>(defaultVersion);
  const [userValues, setUserValues] = useState<string>(
    helmReleaseInitialValues.values || ''
  );
  const [atomic, setAtomic] = useState<boolean>(true);
  const [previewIsValid, setPreviewIsValid] = useState<boolean>(false);

  const chartValuesRefQuery = useHelmChartValues({
    chart: chartName,
    repo: version.Repo,
    version: version.Version,
  });

  const submitPayload = useMemo(
    () => ({
      name: helmReleaseInitialValues.name,
      values: userValues,
      namespace: helmReleaseInitialValues.namespace,
      chart: helmReleaseInitialValues.chart,
      repo: version.Repo,
      version: version.Version,
      atomic,
    }),
    [helmReleaseInitialValues, userValues, version, atomic]
  );

  return (
    <Modal
      onDismiss={() => onSubmit()}
      size="xl"
      className="flex flex-col h-[80vh] px-0"
      aria-label="upgrade-helm"
    >
      <Modal.Header
        title={<WidgetTitle className="px-5" title="Upgrade" icon={ArrowUp} />}
      />
      <div className="flex-1 overflow-y-auto px-5">
        <Modal.Body>
          <div className="form-horizontal">
            <FormControl
              label="Release name"
              inputId="release-name-input"
              size="medium"
            >
              <Input
                id="release-name-input"
                value={helmReleaseInitialValues.name}
                readOnly
                disabled
                data-cy="helm-release-name-input"
              />
            </FormControl>
            <FormControl
              label="Namespace"
              inputId="namespace-input"
              size="medium"
            >
              <Input
                id="namespace-input"
                value={helmReleaseInitialValues.namespace}
                readOnly
                disabled
                data-cy="helm-namespace-input"
              />
            </FormControl>
            <FormControl label="Version" inputId="version-input" size="medium">
              <PortainerSelect<ChartVersion>
                value={version}
                options={versionOptions}
                onChange={(version) => {
                  if (version) {
                    setVersion(version);
                  }
                }}
                data-cy="helm-version-input"
              />
            </FormControl>
            <FormControl
              label="Rollback on failure"
              tooltip="Enables automatic rollback on failure (equivalent to the helm --atomic flag). It may increase the time to upgrade."
              inputId="atomic-input"
              size="medium"
            >
              <Checkbox
                id="atomic-input"
                checked={atomic}
                data-cy="atomic-checkbox"
                onChange={(e) => setAtomic(e.target.checked)}
              />
            </FormControl>
            <HelmValuesInput
              values={userValues}
              setValues={setUserValues}
              valuesRef={chartValuesRefQuery.data?.values ?? ''}
              isValuesRefLoading={chartValuesRefQuery.isInitialLoading}
            />
            <div className="mb-10">
              <ManifestPreviewFormSection
                payload={submitPayload}
                onChangePreviewValidation={setPreviewIsValid}
                title="Manifest changes"
                currentManifest={releaseManifest}
                environmentId={environmentId}
              />
            </div>
          </div>
        </Modal.Body>
      </div>
      <div className="px-5 border-solid border-0 border-t border-gray-5 th-dark:border-gray-7 th-highcontrast:border-white">
        <Modal.Footer>
          <Button
            onClick={() => onSubmit()}
            color="secondary"
            key="cancel-button"
            size="medium"
            data-cy="cancel-button-cy"
          >
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(submitPayload)}
            disabled={!previewIsValid}
            color="primary"
            key="update-button"
            size="medium"
            data-cy="update-button-cy"
          >
            Upgrade
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
}

export async function openUpgradeHelmModal(
  helmReleaseInitialValues: UpdateHelmReleasePayload,
  versions: ChartVersion[],
  releaseManifest: string,
  environmentId: EnvironmentId
) {
  return openModal(withReactQuery(withCurrentUser(UpgradeHelmModal)), {
    helmReleaseInitialValues,
    versions,
    chartName: helmReleaseInitialValues.chart,
    releaseManifest,
    environmentId,
  });
}
