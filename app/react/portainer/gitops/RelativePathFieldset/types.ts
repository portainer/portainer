export function getDefaultRelativePathModel(): RelativePathModel {
  return {
    SupportRelativePath: false,
    FilesystemPath: '',
    PerDeviceConfigsGroupMatchType: '',
    PerDeviceConfigsMatchType: '',
    PerDeviceConfigsPath: '',
    SupportPerDeviceConfigs: false,
  };
}

export interface RelativePathModel {
  SupportRelativePath: boolean;
  FilesystemPath: string;
  SupportPerDeviceConfigs: boolean;
  PerDeviceConfigsPath: string;
  PerDeviceConfigsMatchType: PerDevConfigsFilterType;
  PerDeviceConfigsGroupMatchType: PerDevConfigsFilterType;
}

export type PerDevConfigsFilterType = 'file' | 'dir' | '';

function isPerDevConfigsFilterType(
  type: string
): type is PerDevConfigsFilterType {
  return ['file', 'dir'].includes(type);
}

export function getPerDevConfigsFilterType(
  type: string
): PerDevConfigsFilterType {
  if (isPerDevConfigsFilterType(type)) {
    return type;
  }

  return '';
}
