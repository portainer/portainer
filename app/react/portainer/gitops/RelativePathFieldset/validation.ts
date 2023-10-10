import { boolean, object, SchemaOf, string } from 'yup';

import { RelativePathModel } from '@/react/portainer/gitops/types';

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
      .when(['SupportPerDeviceConfigs'], {
        is: true,
        then: string().required('Directory is required'),
      })
      .default(''),
    PerDeviceConfigsMatchType: string().oneOf(['', 'file', 'dir']),
    PerDeviceConfigsGroupMatchType: string().oneOf(['', 'file', 'dir']),
  });
}
