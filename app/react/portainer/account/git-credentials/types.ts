import {
  PaginationTableSettings,
  SortableTableSettings,
} from '@@/datatables/types';

export interface GitCredentialTableSettings
  extends SortableTableSettings,
    PaginationTableSettings {}

export interface GitCredentialFormValues {
  name: string;
  username?: string;
  password: string;
}

export interface UpdateGitCredentialPayload {
  name: string;
  username?: string;
  password: string;
}

export type GitCredential = {
  id: number;
  userId: number;
  name: string;
  username: string;
  creationDate: number;
};
