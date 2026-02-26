export type AutoUpdateMechanism = 'Webhook' | 'Interval';
export interface AutoUpdateResponse {
  /* Auto update interval */
  Interval: string;

  /* A UUID generated from client */
  Webhook: string;

  /* Force update ignores repo changes */
  ForceUpdate: boolean;

  /* Pull latest image */
  ForcePullImage: boolean;
}

export type AutoUpdateModel = {
  RepositoryAutomaticUpdates: boolean;
  RepositoryMechanism: AutoUpdateMechanism;
  RepositoryFetchInterval: string;
  ForcePullImage: boolean;
  RepositoryAutomaticUpdatesForce: boolean;
};

export function getDefaultAutoUpdateValues(): AutoUpdateModel {
  return {
    RepositoryAutomaticUpdates: false,
    RepositoryAutomaticUpdatesForce: false,
    RepositoryMechanism: 'Interval',
    RepositoryFetchInterval: '5m',
    ForcePullImage: false,
  };
}

export function parseAutoUpdateResponse(
  response?: AutoUpdateResponse | null
): AutoUpdateModel {
  if (!response || (!response?.Interval && !response?.Webhook)) {
    return getDefaultAutoUpdateValues();
  }

  return {
    RepositoryAutomaticUpdates: true,
    RepositoryMechanism: response.Interval ? 'Interval' : 'Webhook',
    RepositoryFetchInterval: response.Interval || '',
    RepositoryAutomaticUpdatesForce: response.ForceUpdate,
    ForcePullImage: response.ForcePullImage,
  };
}

export function transformAutoUpdateViewModel(
  viewModel: AutoUpdateModel | undefined,
  webhookId: string | undefined
): AutoUpdateResponse | null {
  if (!viewModel || !viewModel.RepositoryAutomaticUpdates) {
    return null;
  }

  if (viewModel.RepositoryMechanism === 'Webhook' && !webhookId) {
    throw new Error('Webhook ID is required');
  }

  return {
    Interval:
      viewModel.RepositoryMechanism === 'Interval'
        ? viewModel.RepositoryFetchInterval
        : '',
    Webhook:
      viewModel.RepositoryMechanism === 'Webhook' && webhookId ? webhookId : '',
    ForceUpdate: viewModel.RepositoryAutomaticUpdatesForce,
    ForcePullImage: viewModel.ForcePullImage,
  };
}
