type DocumentationDefinitions = {
  desc: string;
  docURL: string;
  locationRegex: RegExp;
  examples: string[];
};

const definitions: DocumentationDefinitions[] = [
  {
    desc: 'Kubernetes / Dashboard',
    docURL: '/user/kubernetes/dashboard',
    locationRegex: /#!\/\d+\/kubernetes\/dashboard/,
    examples: ['#!/1/kubernetes/dashboard'],
  },
  {
    desc: 'Kubernetes / Custom Templates',
    docURL: '/user/kubernetes/templates',
    locationRegex: /#!\/\d+\/kubernetes\/templates\/custom/,
    examples: [
      '#!/1/kubernetes/templates/custom',
      '#!/1/kubernetes/templates/custom/new?fileContent=',
    ],
  },
  {
    desc: 'Kubernetes / Namespaces',
    docURL: '/user/kubernetes/namespaces',
    locationRegex: /#!\/\d+\/kubernetes\/pools/,
    examples: [
      '#!/1/kubernetes/pools',
      '#!/1/kubernetes/pools/new',
      '#!/1/kubernetes/deploy?templateId=',
      '#!/1/kubernetes/pools/default',
    ],
  },
  {
    desc: 'Kubernetes / Helm',
    docURL: '/user/kubernetes/helm',
    locationRegex: /#!\/\d+\/kubernetes\/templates\/helm/,
    examples: ['#!/1/kubernetes/templates/helm'],
  },
  {
    desc: 'Kubernetes / Applications',
    docURL: '/user/kubernetes/applications',
    locationRegex: /#!\/\d+\/kubernetes\/applications/,
    examples: [
      '#!/1/kubernetes/applications',
      '#!/1/kubernetes/applications/new',
      '#!/1/kubernetes/deploy?templateId=',
      '#!/1/kubernetes/applications/metallb-system/controller',
    ],
  },
  {
    desc: 'Kubernetes / Services',
    docURL: '/user/kubernetes/services',
    locationRegex: /#!\/\d+\/kubernetes\/services/,
    examples: ['#!/1/kubernetes/services'],
  },
  {
    desc: 'Kubernetes / Ingresses',
    docURL: '/user/kubernetes/ingresses',
    locationRegex: /#!\/\d+\/kubernetes\/ingresses/,
    examples: ['#!/1/kubernetes/ingresses'],
  },
  {
    desc: 'Kubernetes / ConfigMaps & Secrets',
    docURL: '/user/kubernetes/configurations',
    locationRegex: /#!\/\d+\/kubernetes\/configurations/,
    examples: [
      '#!/1/kubernetes/configurations',
      '#!/1/kubernetes/configurations/new',
      '#!/1/kubernetes/configurations/metallb-system/config',
    ],
  },
  {
    desc: 'Kubernetes / Volumes',
    docURL: '/user/kubernetes/volumes',
    locationRegex: /#!\/\d+\/kubernetes\/volumes/,
    examples: ['#!/1/kubernetes/volumes'],
  },
  {
    desc: 'Kubernetes / Cluster / Set up',
    docURL: '/user/kubernetes/cluster/setup',
    locationRegex: /#!\/\d+\/kubernetes\/cluster\/configure/,
    examples: ['#!/1/kubernetes/cluster/configure'],
  },
  {
    desc: 'Kubernetes / Cluster / Security constraints',
    docURL: '/user/kubernetes/cluster/security',
    locationRegex: /#!\/\d+\/kubernetes\/cluster\/securityConstraint/,
    examples: ['#!/1/kubernetes/cluster/securityConstraint'],
  },
  {
    desc: 'Kubernetes / Cluster',
    docURL: '/user/kubernetes/cluster',
    locationRegex: /#!\/\d+\/kubernetes\/cluster/,
    examples: [
      '#!/1/kubernetes/cluster',
      '#!/1/kubernetes/cluster/ip-10-138-11-102',
      '#!/1/kubernetes/cluster/ip-10-138-11-102/stats',
    ],
  },
  {
    desc: 'Kubernetes / Cluster / Registries',
    docURL: '/user/kubernetes/cluster/registries',
    locationRegex: /#!\/\d+\/kubernetes\/registries/,
    examples: ['#!/1/kubernetes/registries'],
  },

  {
    desc: 'Nomad / Dashboard',
    docURL: '/user/nomad/dashboard',
    locationRegex: /#!\/\d+\/nomad\/dashboard/,
    examples: ['#!/2/nomad/dashboard'],
  },
  {
    desc: 'Nomad / Nomad Jobs',
    docURL: '/user/nomad/jobs',
    locationRegex: /#!\/\d+\/nomad\/jobs/,
    examples: [
      '#!/2/nomad/jobs',
      '#!/2/nomad/jobs/portainer-agent/tasks/portainer-agent/allocations/acdbf08e-34af-9b8a-cc84-7dc202bf1fcf/events?namespace=default',
      '#!/2/nomad/jobs/portainer-agent/tasks/portainer-agent/allocations/acdbf08e-34af-9b8a-cc84-7dc202bf1fcf/logs?namespace=default',
    ],
  },
];

type Documentation = Pick<DocumentationDefinitions, 'docURL'>;

const DEFAULT_DOC: Documentation = {
  docURL: '/',
};

export function getDocURL(): Documentation {
  const { hash } = window.location;

  let doc: Documentation | undefined = definitions.find((def) =>
    hash.match(def.locationRegex)
  );
  if (!doc) {
    doc = DEFAULT_DOC;
  }
  return doc;
}
