interface ResourceStatus {
  phase?: string;
  reason?: string;
  message?: string;
  healthSummary?: {
    status: string;
    reason: string;
    message?: string;
  };
}

// A resource has a bunch of common fields that are shared by all kubernetes resources, so can be used when we're unsure about the resource type we have
export interface GenericResource {
  apiVersion?: string;
  kind?: string;
  metadata: {
    name: string;
    namespace?: string;
    uid?: string;
  };
  status: ResourceStatus;
}

export interface HelmRelease {
  /** The name of the release */
  name: string;
  /** Information about the release */
  info?: {
    status?: string;
    notes?: string;
    description?: string;
    resources?: GenericResource[];
    last_deployed: string;
  };
  /** The chart that was released */
  chart: HelmChart;
  /** Extra values added to the chart that override the default values */
  config?: Record<string, unknown>;
  /** String representation of the rendered template */
  manifest: string;
  /** All hooks declared for this release */
  hooks?: unknown[];
  /** Integer representing the revision of the release */
  version?: number;
  /** Kubernetes namespace of the release */
  namespace?: string;
  /** Values of the release */
  values?: Values;
}

export interface Values {
  /** User supplied values */
  userSuppliedValues?: string;
  /** Computed values */
  computedValues?: string;
}

export interface HelmChart {
  /** Raw contents of the files originally contained in the chart archive. Only used in special cases like `helm show values` */
  raw?: unknown[];
  /** Contents of the Chartfile */
  metadata?: {
    name?: string;
    version?: string;
    appVersion?: string;
  };
  /** Contents of Chart.lock */
  lock?: unknown;
  /** Templates for this chart */
  templates?: unknown[];
  /** Default config for this chart */
  values?: Record<string, unknown>;
  /** Optional JSON schema for imposing structure on Values */
  schema?: unknown;
  /** Miscellaneous files in a chart archive (e.g. README, LICENSE) */
  files?: unknown[];
}

export interface Chart extends HelmChartResponse {
  repo: string;
}

export interface HelmChartResponse {
  name: string;
  description: string;
  icon?: string;
  annotations?: {
    category?: string;
  };
  version: string;
  versions: string[];
}

export interface HelmRepositoryResponse {
  Id: number;
  UserId: number;
  URL: string;
}

export interface HelmRegistriesResponse {
  GlobalRepository: string;
  UserRepositories: HelmRepositoryResponse[];
}

export interface HelmChartsResponse {
  entries: Record<string, HelmChartResponse[]>;
  apiVersion: string;
  generated: string;
}

export interface InstallChartPayload {
  Name: string;
  Repo: string;
  Chart: string;
  Values: string;
  Namespace: string;
  Version?: string;
}

export interface UpdateHelmReleasePayload {
  namespace: string;
  values?: string;
  repo: string;
  name: string;
  chart: string;
  appVersion?: string;
  version?: string;
  atomic?: boolean;
}
