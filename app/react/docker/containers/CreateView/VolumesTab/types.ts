export const volumeTypes = ['bind', 'volume'] as const;

export type VolumeType = (typeof volumeTypes)[number];

export interface Volume {
  containerPath: string;
  type: VolumeType;
  name: string;
  readOnly: boolean;
}

export type Values = Array<Volume>;
