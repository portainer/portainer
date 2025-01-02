import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

import { ExperimentalFeatures } from '../types';
import { buildUrl } from '../settings.service';

import { queryKeys } from './queryKeys';

type ExperimentalFeaturesSettings = {
  experimentalFeatures: ExperimentalFeatures;
};

export function useExperimentalSettings<T = ExperimentalFeaturesSettings>(
  select?: (settings: ExperimentalFeaturesSettings) => T,
  enabled = true
) {
  return useQuery(queryKeys.experimental(), getExperimentalSettings, {
    select,
    enabled,
    staleTime: 50,
    ...withError('Unable to retrieve experimental settings'),
  });
}

async function getExperimentalSettings() {
  try {
    const { data } = await axios.get<ExperimentalFeaturesSettings>(
      buildUrl('experimental')
    );
    return data;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve experimental settings'
    );
  }
}
