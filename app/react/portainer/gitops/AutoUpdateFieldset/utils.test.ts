import { parseAutoUpdateResponse } from './utils';

describe('parseAutoUpdateResponse', () => {
  test('returns default disabled values when response is missing or empty', () => {
    expect(parseAutoUpdateResponse(null)).toEqual({
      RepositoryAutomaticUpdates: false,
      RepositoryAutomaticUpdatesForce: false,
      ForcePullImage: false,
    });

    expect(
      parseAutoUpdateResponse({
        Interval: '',
        Webhook: '',
        ForceUpdate: false,
        ForcePullImage: false,
      })
    ).toEqual({
      RepositoryAutomaticUpdates: false,
      RepositoryAutomaticUpdatesForce: false,
      ForcePullImage: false,
    });
  });

  test('ignores deprecated Interval when Webhook is not configured', () => {
    expect(
      parseAutoUpdateResponse({
        Interval: '5m',
        Webhook: '',
        ForceUpdate: true,
        ForcePullImage: true,
      })
    ).toEqual({
      RepositoryAutomaticUpdates: false,
      RepositoryAutomaticUpdatesForce: false,
      ForcePullImage: false,
    });
  });

  test('enables automatic updates when Webhook is configured', () => {
    expect(
      parseAutoUpdateResponse({
        Interval: '5m',
        Webhook: 'webhook-uuid',
        ForceUpdate: true,
        ForcePullImage: false,
      })
    ).toEqual({
      RepositoryAutomaticUpdates: true,
      RepositoryAutomaticUpdatesForce: true,
      ForcePullImage: false,
    });
  });
});
