import { AutoUpdateResponse, AutoUpdateModel } from '../types';

export function parseAutoUpdateResponse(
  response?: AutoUpdateResponse
): AutoUpdateModel {
  if (!response || (!response?.Interval && !response?.Webhook)) {
    return {
      RepositoryAutomaticUpdates: false,
      RepositoryAutomaticUpdatesForce: false,
      RepositoryMechanism: 'Interval',
      RepositoryFetchInterval: '5m',
      ForcePullImage: false,
    };
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
  viewModel?: AutoUpdateModel,
  webhookId?: string
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
