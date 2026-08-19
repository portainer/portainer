import { useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { withReactQuery } from '@/react-tools/withReactQuery';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ChartVersion } from '@/react/kubernetes/helm/helmChartSourceQueries/useHelmRepoVersions';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { K8sRegistryAccessNotice } from '@/react/kubernetes/components/K8sRegistryAccessNotice';
import { withUIRouter } from '@/react-tools/withUIRouter';

import { Modal, OnSubmit, openModal } from '@@/modals';
import { confirm } from '@@/modals/confirm';
import { Button } from '@@/buttons';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { WidgetIcon } from '@@/Widget/WidgetIcon';
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
      className="flex h-[80vh] flex-col px-0"
      aria-label="upgrade-helm"
    >
      <Modal.Header
        title={
          <div className="inline-flex items-center gap-1 px-5">
            <WidgetIcon icon={ArrowUp} />
            <h2 className="m-0 ml-1 text-base">Upgrade</h2>
          </div>
        }
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
              <div className="mb-1">
                <K8sRegistryAccessNotice
                  namespace={helmReleaseInitialValues.namespace}
                  environmentId={environmentId}
                />
              </div>
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
              tooltip="Enables automatic rollback on failure. It may increase the time to upgrade."
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
      <div className="border-0 border-t border-solid border-gray-5 px-5 th-highcontrast:border-white th-dark:border-gray-7">
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
            onClick={async () => {
              if (!previewIsValid) {
                const confirmed = await confirm({
                  title: 'Chart validation failed',
                  message:
                    'The Helm manifest preview validation failed, which may indicate configuration issues. This can be normal when creating new resources. Do you want to proceed with the upgrade?',
                });
                if (!confirmed) {
                  return;
                }
              }
              onSubmit(submitPayload);
            }}
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
  return openModal(
    withUIRouter(withReactQuery(withCurrentUser(UpgradeHelmModal))),
    {
      helmReleaseInitialValues,
      versions,
      chartName: helmReleaseInitialValues.chart,
      releaseManifest,
      environmentId,
    }
  );
}
