import uuidv4 from 'uuid/v4';

import { VolumeViewModel } from './ListView/types';

export function isVolumeUsed(volume: VolumeViewModel) {
  return volume.Applications.length !== 0;
}

export function isVolumeExternal(volume: VolumeViewModel) {
  return !volume.PersistentVolumeClaim.ApplicationOwner;
}

export function generatedApplicationConfigVolumeName(applicationName: string) {
  return `config-${applicationName}-${uuidv4()}`;
}
