import { useState } from 'react';

import { useCurrentUser } from '@/react/hooks/useUser';

import { FormSection } from '@@/form-components/FormSection';

import { useHelmHTTPChartList } from '../helmChartSourceQueries/useHelmChartList';
import { Chart } from '../types';
import {
  HelmRegistrySelect,
  RepoValue,
} from '../components/HelmRegistrySelect';
import { useHelmRepoOptions } from '../helmChartSourceQueries/useHelmRepositories';
import { HelmInstallForm } from '../install/HelmInstallForm';

import { HelmTemplatesSelectedItem } from './HelmTemplatesSelectedItem';
import { HelmTemplatesList } from './HelmTemplatesList';

interface Props {
  onSelectHelmChart: (chartName: string) => void;
  namespace?: string;
  name?: string;
}

export function HelmTemplates({ onSelectHelmChart, namespace, name }: Props) {
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<RepoValue | null>(null);
  const { user } = useCurrentUser();
  const chartListQuery = useHelmHTTPChartList(
    user.Id,
    selectedRepo?.repoUrl ?? '',
    !!selectedRepo?.repoUrl
  );
  const repoOptionsQuery = useHelmRepoOptions();
  const isRepoAvailable =
    !!repoOptionsQuery.data && repoOptionsQuery.data.length > 0;

  return (
    <div className="row">
      <div className="col-sm-12 p-0">
        <FormSection title="Helm chart">
          {selectedChart ? (
            <>
              <HelmTemplatesSelectedItem
                selectedChart={selectedChart}
                clearHelmChart={clearHelmChart}
              />
              <HelmInstallForm
                selectedChart={selectedChart}
                namespace={namespace}
                name={name}
                isRepoAvailable={isRepoAvailable}
              />
            </>
          ) : (
            <>
              <HelmRegistrySelect
                selectedRegistry={selectedRepo}
                onRegistryChange={setSelectedRepo}
                namespace={namespace}
                isRepoAvailable={isRepoAvailable}
                isLoading={repoOptionsQuery.isLoading}
                isError={repoOptionsQuery.isError}
                repoOptions={repoOptionsQuery.data ?? []}
              />
              {selectedRepo && (
                <HelmTemplatesList
                  charts={chartListQuery.data ?? []}
                  selectAction={handleChartSelection}
                  isLoadingCharts={chartListQuery.isInitialLoading}
                  selectedRegistry={selectedRepo}
                />
              )}
            </>
          )}
        </FormSection>
      </div>
    </div>
  );

  function clearHelmChart() {
    setSelectedChart(null);
    onSelectHelmChart('');
  }

  function handleChartSelection(chart: Chart) {
    setSelectedChart(chart);
    onSelectHelmChart(chart.name);
  }
}
