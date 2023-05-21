// matches https://github.com/portainer/liblicense/blob/develop/liblicense.go#L66-L74
export enum Edition {
  CE = 1,
  BE,
  EE,
}

// matches https://github.com/portainer/liblicense/blob/develop/liblicense.go#L64-L69

export enum LicenseType {
  Trial = 1,
  Subscription,
  /**
   * Essentials is the free 5-node license type
   */
  Essentials,
}

// matches https://github.com/portainer/liblicense/blob/develop/liblicense.go#L35-L50
export interface License {
  id: string;
  company: string;
  created: number;
  email: string;
  expiresAfter: number;
  licenseKey: string;
  nodes: number;
  productEdition: Edition;
  revoked: boolean;
  revokedAt: number;
  type: LicenseType;
  version: number;
  reference: string;
  expiresAt: number;
}

// matches https://github.com/portainer/portainer-ee/blob/c4575bf528583fe1682267db4ee40a11a905f611/api/portainer.go#L588-L597
export interface LicenseInfo {
  productEdition: Edition;
  company: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  nodes: number;
  type: LicenseType;
  valid: boolean;
  enforcedAt: number;
  enforced: boolean;
}
