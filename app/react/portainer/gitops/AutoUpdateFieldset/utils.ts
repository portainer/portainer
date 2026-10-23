export interface AutoUpdateResponse {
  /**
   * Auto update interval
   *
   * @deprecated polling interval now lives on the associated Source (Source.Interval).
   * Kept for API backwards-compatibility only; the UI never reads or writes this field.
   */
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
  ForcePullImage: boolean;
  RepositoryAutomaticUpdatesForce: boolean;
};

export function getDefaultAutoUpdateValues(): AutoUpdateModel {
  return {
    RepositoryAutomaticUpdates: false,
    RepositoryAutomaticUpdatesForce: false,
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

  if (!webhookId) {
    throw new Error('Webhook ID is required');
  }

  return {
    Interval: '',
    Webhook: webhookId,
    ForceUpdate: viewModel.RepositoryAutomaticUpdatesForce,
    ForcePullImage: viewModel.ForcePullImage,
  };
}
