import { GitFormModel } from '@/react/portainer/gitops/types';

export interface GitFormValues extends GitFormModel {
  SupportRelativePath: boolean;
  FilesystemPath: string;
}
