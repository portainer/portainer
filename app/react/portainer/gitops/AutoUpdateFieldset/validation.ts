import { string, boolean, object, SchemaOf } from 'yup';

import { AutoUpdateModel } from '../types';

export function autoUpdateValidation(): SchemaOf<AutoUpdateModel> {
  return object({
    RepositoryAutomaticUpdates: boolean().default(false),
    RepositoryAutomaticUpdatesForce: boolean().default(false),
    RepositoryWebhookId: string().default(''),
    ForcePullImage: boolean().default(false),
  });
}
