import { boolean, mixed, object, SchemaOf, string } from 'yup';

import { PerDevConfigsFilterType, RelativePathModel } from './types';

export function relativePathValidation(): SchemaOf<RelativePathModel> {
  return object({
    SupportRelativePath: boolean().default(false),
    FilesystemPath: string()
      .when(['SupportRelativePath'], {
        is: true,
        then: string().required('Local filesystem path is required'),
      })
      .default(''),
    SupportPerDeviceConfigs: boolean().default(false),
    PerDeviceConfigsPath: string()
      .when('SupportPerDeviceConfigs', {
        is: true,
        then: string().required('Directory is required'),
      })
      .default(''),
    PerDeviceConfigsMatchType: mixed<PerDevConfigsFilterType>()
      .oneOf(['', 'file', 'dir'])
      .default(''),
    PerDeviceConfigsGroupMatchType: mixed<PerDevConfigsFilterType>()
      .oneOf(['', 'file', 'dir'])
      .default(''),
  });
}
