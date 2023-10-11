import { VolumeViewModel } from '@/docker/models/volume';

export type DecoratedVolume = VolumeViewModel & { dangling: boolean };
