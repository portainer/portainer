import uuidv4 from 'uuid/v4';

import { PersistentVolume, VolumeViewModel } from './ListView/types';

export function isVolumeUsed(volume: VolumeViewModel) {
  return volume.Applications.length !== 0;
}

export function isPersistentVolumeUsed(volume: PersistentVolume) {
  return volume.claimRef !== null;
}

export function generatedApplicationConfigVolumeName(applicationName: string) {
  return `config-${applicationName}-${uuidv4()}`;
}
