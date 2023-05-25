export interface Namespaces {
  [key: string]: {
    IsDefault: boolean;
    IsSystem: boolean;
  };
}

export interface SelfSubjectAccessReviewResponse {
  status: {
    allowed: boolean;
  };
  spec: {
    resourceAttributes: {
      namespace: string;
    };
  };
}
