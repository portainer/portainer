type DocumentationDefinitions = {
  desc: string;
  docURL: string;
  locationRegex: RegExp;
  examples: string[];
};

const definitions: DocumentationDefinitions[] = [
  {
    desc: 'Docker or Swarm / Containers',
    docURL: '/user/docker/containers',
    locationRegex: /#!\/\d+\/docker\/containers/,
    examples: [
      '#!/10/docker/containers',
      '#!/10/docker/containers/new',
      '#!/10/docker/containers/new?from=49ff4ae03d10c57fe375f6968c48a6169a9852a6bfbb5137cd30c615d58188c1',
      '#!/10/docker/containers/49ff4ae03d10c57fe375f6968c48a6169a9852a6bfbb5137cd30c615d58188c1',
      '#!/10/docker/containers/49ff4ae03d10c57fe375f6968c48a6169a9852a6bfbb5137cd30c615d58188c1/logs',
      '#!/10/docker/containers/49ff4ae03d10c57fe375f6968c48a6169a9852a6bfbb5137cd30c615d58188c1/inspect',
      '#!/10/docker/containers/49ff4ae03d10c57fe375f6968c48a6169a9852a6bfbb5137cd30c615d58188c1/stats',
    ],
  },
  {
    desc: 'Docker or Swarm / Images',
    docURL: '/user/docker/images',
    locationRegex: /#!\/\d+\/docker\/images/,
    examples: [
      '#!/10/docker/images',
      '#!/10/docker/images/build',
      '#!/10/docker/images/sha256:feb5d9fea6a5e9606aa995e879d862b825965ba48de054caab5ef356dc6b3412',
    ],
  },
  {
    desc: 'Docker or Swarm / Networks',
    docURL: '/user/docker/networks',
    locationRegex: /#!\/\d+\/docker\/networks/,
    examples: [
      '#!/10/docker/networks',
      '#!/10/docker/networks/new',
      '#!/10/docker/networks/db5732ff4a2c6df70a18530dba6abd8625f8e94c5fc5daabbcbab07377ee1044',
    ],
  },
  {
    desc: 'Docker or Swarm / Volumes',
    docURL: '/user/docker/volumes',
    locationRegex: /#!\/\d+\/docker\/volumes/,
    examples: [
      '#!/10/docker/volumes',
      '#!/10/docker/volumes/new',
      '#!/10/docker/volumes/153b46162f5bab9a7c9d2c8e1675115fcedd4c0ccdf5834159400750fa6b794c',
    ],
  },
  {
    desc: 'Swarm / Configs',
    docURL: '/user/docker/configs',
    locationRegex: /#!\/\d+\/docker\/configs/,
    examples: [
      '#!/10/docker/configs',
      '#!/10/docker/configs/new',
      '#!/10/docker/configs/azd0xc805l298jrgnadbnnzyv',
    ],
  },
  {
    desc: 'Swarm / Secrets',
    docURL: '/user/docker/secrets',
    locationRegex: /#!\/\d+\/docker\/secrets/,
    examples: [
      '#!/10/docker/secrets',
      '#!/10/docker/secrets/new',
      '#!/10/docker/secrets/tsoeeh7ln7g54g5qkk67eg4xe',
    ],
  },
  {
    desc: 'Docker or Swarm / Swarm / Cluster visualizer',
    docURL: '/user/docker/swarm/cluster-visualizer',
    locationRegex: /#!\/\d+\/docker\/swarm\/visualizer/,
    examples: ['#!/10/docker/swarm/visualizer'],
  },
  {
    desc: 'Docker or Swarm / Swarm / Set up',
    docURL: '/user/docker/swarm/setup',
    locationRegex: /#!\/\d+\/docker\/swarm\/feat-config/,
    examples: ['#!/10/docker/feat-config'],
  },
  {
    desc: 'Swarm / Swarm / Registries',
    docURL: '/user/docker/swarm/registries',
    locationRegex: /#!\/\d+\/docker\/swarm\/registries/,
    examples: ['#!/10/docker/registries'],
  },
  {
    desc: 'Swarm / Swarm',
    docURL: '/user/docker/swarm',
    locationRegex: /#!\/\d+\/docker\/(swarm|nodes)/,
    examples: [
      '#!/10/docker/swarm',
      '#!/10/docker/nodes/nd694yepzgms1j8y7kv3lpcc3',
    ],
  },
  {
    desc: 'Docker / Events',
    docURL: '/user/docker/events',
    locationRegex: /#!\/\d+\/docker\/events/,
    examples: ['#!/10/docker/events'],
  },
  {
    desc: 'Docker / Host / Registries',
    docURL: '/user/docker/host/registries',
    locationRegex: /#!\/\d+\/docker\/host\/registries/,
    examples: ['#!/10/docker/registries'],
  },
  {
    desc: 'Docker / Host / Setup',
    docURL: '/user/docker/host/setup',
    locationRegex: /#!\/\d+\/docker\/host\/feat-config/,
    examples: ['#!/10/docker/feat-config'],
  },
  {
    desc: 'Docker / Host',
    docURL: '/user/docker/host',
    locationRegex: /#!\/\d+\/docker\/host/,
    examples: ['#!/10/docker/host'],
  },
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
    desc: 'Azure ACI / Dashboard',
    docURL: '/user/aci/dashboard',
    locationRegex: /#!\/\d+\/azure\/dashboard/,
    examples: ['#!/26/azure/dashboard'],
  },
  {
    desc: 'Azure ACI / Container instances',
    docURL: '/user/aci/containers',
    locationRegex: /#!\/\d+\/azure\/containerinstances/,
    examples: ['#!/26/azure/containerinstances'],
  },
  {
    desc: 'Edge Compute / Edge Devices',
    docURL: '/user/edge/devices',
    locationRegex: /#!\/edge\/devices/,
    examples: ['#!/edge/devices', '#!/edge/devices/waiting-room'],
  },
  {
    desc: 'Edge Compute / Edge Groups',
    docURL: '/user/edge/groups',
    locationRegex: /#!\/edge\/groups/,
    examples: ['#!/edge/groups', '#!/edge/groups/new'],
  },
  {
    desc: 'Edge Compute / Edge Stacks ',
    docURL: '/user/edge/stacks',
    locationRegex: /#!\/edge\/stacks/,
    examples: ['#!/edge/stacks', '#!/edge/stacks/new'],
  },
  {
    desc: 'Edge Compute / Edge Jobs',
    docURL: '/user/edge/jobs',
    locationRegex: /#!\/edge\/jobs/,
    examples: ['#!/edge/jobs', '#!/edge/jobs/new'],
  },
  {
    desc: 'Edge Compute / Edge Configurations',
    docURL: '/user/edge/configurations',
    locationRegex: /#!\/edge\/configurations/,
    examples: ['#!/edge/configurations', '#!/edge/configurations/new'],
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
  {
    desc: 'Account Settings',
    docURL: '/user/account-settings',
    locationRegex: /#!\/account/,
    examples: ['#!/account', '#!/account/tokens/new'],
  },
  {
    desc: 'Settings / Users',
    docURL: '/admin/users',
    locationRegex: /#!\/users/,
    examples: ['#!/users', '#!/users/1'],
  },
  {
    desc: 'Settings / Users / Teams',
    docURL: '/admin/users/teams',
    locationRegex: /#!\/teams/,
    examples: ['#!/teams', '#!/teams/1'],
  },
  {
    desc: 'Settings / Users / Roles',
    docURL: '/admin/users/roles',
    locationRegex: /#!\/roles/,
    examples: ['#!/roles'],
  },
  {
    desc: 'Settings / Environments',
    docURL: '/admin/environments',
    locationRegex: /#!\/endpoints/,
    examples: ['#!/endpoints', '#!/endpoints/10', '#!/endpoints/10/access'],
  },
  {
    desc: 'Settings / Environments / Groups',
    docURL: '/admin/environments/groups',
    locationRegex: /#!\/groups/,
    examples: [
      '#!/groups',
      '#!/groups/new',
      '#!/groups/3',
      '#!/groups/3/access',
    ],
  },
  {
    desc: 'Settings / Environments / Tags',
    docURL: '/admin/environments/tags',
    locationRegex: /#!\/tags/,
    examples: ['#!/tags'],
  },
  {
    desc: 'Settings / Registries',
    docURL: '/admin/registries',
    locationRegex: /#!\/registries/,
    examples: [
      '#!/registries',
      '#!/registries/new',
      '#!/registries/1',
      '#!/registries/1/repositories',
      '#!/registries/1/configure',
      '#!/registries/5/portainer.demo~2Fportainerregistrytesting~2Falpine',
      '#!/registries/5/portainer.demo~2Fportainerregistrytesting~2Falpine/jfadelhaye',
    ],
  },
  {
    desc: 'Settings / Licenses',
    docURL: '/admin/licenses',
    locationRegex: /#!\/licenses/,
    examples: ['#!/licenses', '#!/licenses/licenses/new'],
  },
  {
    desc: 'Settings / Authentication logs',
    docURL: '/admin/logs',
    locationRegex: /#!\/auth-logs/,
    examples: ['#!/auth-logs'],
  },
  {
    desc: 'Settings / Authentication logs / Activity logs',
    docURL: '/admin/logs/activity',
    locationRegex: /#!\/activity-logs/,
    examples: ['#!/activity-logs'],
  },
  {
    desc: 'Settings / Settings / Authentication',
    docURL: '/admin/settings/authentication',
    locationRegex: /#!\/settings\/auth/,
    examples: ['#!/settings/auth'],
  },
  {
    desc: 'Settings / Settings / Notifications',
    docURL: '/admin/notifications',
    locationRegex: /#!\/notifications/,
    examples: ['#!/notifications'],
  },
  {
    desc: 'Settings / Settings / Cloud settings',
    docURL: '/admin/settings/cloud',
    locationRegex: /#!\/settings\/cloud/,
    examples: [
      '#!/settings/cloud',
      '#!/settings/cloud/credentials/new',
      '#!/settings/cloud/credentials/1',
    ],
  },
  {
    desc: 'Settings / Settings / Edge Compute',
    docURL: '/admin/settings/edge',
    locationRegex: /#!\/settings\/edge/,
    examples: ['#!/settings/edge'],
  },
  {
    desc: 'Settings / Settings',
    docURL: '/admin/settings',
    locationRegex: /#!\/settings/,
    examples: ['#!/settings'],
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
