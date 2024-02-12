export interface CreateHelmRepositoryPayload {
  UserId: number;
  URL: string;
}

export interface HelmRepositoryFormValues {
  URL: string;
}

export interface HelmRepository {
  Id: number;
  UserId: number;
  URL: string;
  Global: boolean;
}

export interface HelmRepositories {
  UserRepositories: HelmRepository[];
  GlobalRepository: string;
}
