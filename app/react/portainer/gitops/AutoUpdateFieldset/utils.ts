import { v4 as uuid } from 'uuid';

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
      RepositoryWebhookId: uuid(),
      ForcePullImage: false,
    };
  }

  return {
    RepositoryAutomaticUpdates: true,
    RepositoryMechanism: response.Interval ? 'Interval' : 'Webhook',
    RepositoryFetchInterval: response.Interval || '',
    RepositoryWebhookId: response.Webhook || uuid(),
    RepositoryAutomaticUpdatesForce: response.ForceUpdate,
    ForcePullImage: response.ForcePullImage,
  };
}

export function transformAutoUpdateViewModel(
  viewModel?: AutoUpdateModel
): AutoUpdateResponse | null {
  if (!viewModel || !viewModel.RepositoryAutomaticUpdates) {
    return null;
  }

  return {
    Interval:
      viewModel.RepositoryMechanism === 'Interval'
        ? viewModel.RepositoryFetchInterval
        : '',
    Webhook:
      viewModel.RepositoryMechanism === 'Webhook'
        ? viewModel.RepositoryWebhookId
        : '',
    ForceUpdate: viewModel.RepositoryAutomaticUpdatesForce,
    ForcePullImage: viewModel.ForcePullImage,
  };
}
