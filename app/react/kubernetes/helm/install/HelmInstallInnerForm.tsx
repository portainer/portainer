import { Form, useFormikContext } from 'formik';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { FormControl } from '@@/form-components/FormControl';
import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';
import { FormSection } from '@@/form-components/FormSection';
import { LoadingButton } from '@@/buttons';

import { Chart } from '../types';
import { useHelmChartValues } from '../helmChartSourceQueries/useHelmChartValues';
import { HelmValuesInput } from '../components/HelmValuesInput';
import { ChartVersion } from '../helmChartSourceQueries/useHelmRepoVersions';
import { ManifestPreviewFormSection } from '../components/ManifestPreviewFormSection';

import { HelmInstallFormValues } from './types';

type Props = {
  selectedChart: Chart;
  namespace?: string;
  name?: string;
  versionOptions: Option<ChartVersion>[];
  isVersionsLoading: boolean;
  isRepoAvailable: boolean;
  setPreviewIsValid: (isValid: boolean) => void;
};

export function HelmInstallInnerForm({
  selectedChart,
  namespace,
  name,
  versionOptions,
  isVersionsLoading,
  isRepoAvailable,
  setPreviewIsValid,
}: Props) {
  const environmentId = useEnvironmentId();
  const { t } = useTranslation();
  const { values, setFieldValue, isSubmitting } =
    useFormikContext<HelmInstallFormValues>();

  const selectedVersion: ChartVersion | undefined = useMemo(
    () =>
      versionOptions.find(
        (v) =>
          v.value.Version === values.version &&
          v.value.Repo === selectedChart.repo
      )?.value ?? versionOptions[0]?.value,
    [versionOptions, values.version, selectedChart.repo]
  );

  const repoParams = {
    repo: selectedChart.repo,
  };
  // use isLatestVersionFetched to cache the latest version, to avoid duplicate fetches
  const isLatestVersionFetched =
    // if no version is selected, the latest version gets fetched
    !versionOptions.length ||
    // otherwise check if the selected version is the latest version
    (selectedVersion?.Version === versionOptions[0]?.value.Version &&
      selectedVersion?.Repo === versionOptions[0]?.value.Repo);
  const chartValuesRefQuery = useHelmChartValues(
    {
      chart: selectedChart.name,
      version: values?.version,
      ...repoParams,
    },
    isLatestVersionFetched
  );

  const payload = useMemo(
    () => ({
      name: name || '',
      namespace: namespace || '',
      chart: selectedChart.name,
      version: values?.version,
      repo: selectedChart.repo,
      values: values.values,
    }),
    [
      name,
      namespace,
      selectedChart.name,
      values?.version,
      selectedChart.repo,
      values.values,
    ]
  );

  return (
    <Form className="form-horizontal">
      <div className="form-group !m-0">
        <FormSection title={t('kubernetes.helm.install.configuration')} className="mt-4">
          <FormControl
            label={t('kubernetes.helm.install.version')}
            inputId="version-input"
            isLoading={isVersionsLoading}
            loadingText={t('kubernetes.helm.install.loadingVersions')}
          >
            <PortainerSelect<ChartVersion>
              value={selectedVersion}
              options={versionOptions}
              noOptionsMessage={() => t('kubernetes.helm.install.noVersionsFound')}
              placeholder={t('kubernetes.helm.install.selectVersion')}
              onChange={(version) => {
                if (version) {
                  setFieldValue('version', version.Version);
                  setFieldValue('repo', version.Repo);
                }
              }}
              data-cy="helm-version-input"
            />
          </FormControl>
          <HelmValuesInput
            values={values.values}
            setValues={(values) => setFieldValue('values', values)}
            valuesRef={chartValuesRefQuery.data?.values ?? ''}
            isValuesRefLoading={chartValuesRefQuery.isInitialLoading}
          />
        </FormSection>
        <ManifestPreviewFormSection
          payload={payload}
          onChangePreviewValidation={setPreviewIsValid}
          title={t('kubernetes.helm.install.manifestPreview')}
          environmentId={environmentId}
        />
      </div>

      <LoadingButton
        className="!ml-0 mt-5"
        loadingText={t('kubernetes.helm.install.installingHelmChart')}
        isLoading={isSubmitting}
        disabled={!namespace || !name || !isRepoAvailable}
        data-cy="helm-install"
      >
        {t('kubernetes.helm.install.installButton')}
      </LoadingButton>
    </Form>
  );
}
