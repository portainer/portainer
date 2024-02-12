interface Filters {
  /* dangling=<boolean> When set to true (or 1), returns all networks that are not in use by a container. When set to false (or 0), only networks that are in use by one or more containers are returned. */
  dangling?: [boolean];
  // Matches a network's driver
  driver?: string[];
  // Matches all or part of a network ID
  id?: string[];
  // `label=<key>` or `label=<key>=<value>` of a network label.
  label?: string[];
  // Matches all or part of a network name.
  name?: string[];
  // Filters networks by scope (swarm, global, or local).
  scope?: ('swarm' | 'global' | 'local')[];
  //  Filters networks by type. The custom keyword returns all user-defined networks.
  type?: ('custom' | 'builtin')[];
}

export interface NetworksQuery {
  local?: boolean;
  swarm?: boolean;
  swarmAttachable?: boolean;
  filters?: Filters;
}
