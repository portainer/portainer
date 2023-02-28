import { string, boolean, object, SchemaOf, mixed } from 'yup';

import { AutoUpdateMechanism, AutoUpdateModel } from '../types';

import { intervalValidation } from './IntervalField';

export function autoUpdateValidation(): SchemaOf<AutoUpdateModel> {
  return object({
    RepositoryAutomaticUpdates: boolean().default(false),
    RepositoryAutomaticUpdatesForce: boolean().default(false),
    RepositoryMechanism: mixed<AutoUpdateMechanism>()
      .oneOf(['Interval', 'Webhook'])
      .when('RepositoryAutomaticUpdates', {
        is: true,
        then: string().required(),
      })
      .default('Interval'),
    RepositoryFetchInterval: string()
      .default('')
      .when(['RepositoryAutomaticUpdates', 'RepositoryMechanism'], {
        is: (autoUpdates: boolean, mechanism: AutoUpdateMechanism) =>
          autoUpdates && mechanism === 'Interval',
        then: intervalValidation(),
      }),
    RepositoryWebhookId: string().default(''),
    ForcePullImage: boolean().default(false),
  });
}
