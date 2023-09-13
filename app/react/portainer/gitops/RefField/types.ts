import { GitCredentialsModel } from '../types';

export interface RefFieldModel extends GitCredentialsModel {
  RepositoryURL: string;
  TLSSkipVerify?: boolean;
}
