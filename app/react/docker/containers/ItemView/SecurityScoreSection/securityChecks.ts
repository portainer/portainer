export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface SecurityCheck {
  id: string;
  title: string;
  description: string;
  risk: string;
  fix: string;
  status: CheckStatus;
}

type PortBindings = Record<
  string,
  Array<{ HostIp?: string; HostPort?: string }> | null | undefined
>;

export interface InspectLike {
  Config?: { User?: string; Image?: string };
  HostConfig?: {
    Memory?: number;
    Privileged?: boolean;
    ReadonlyRootfs?: boolean;
    Binds?: string[] | null;
    PortBindings?: PortBindings | null;
  };
  Mounts?: Array<{ Source?: string }> | null;
}

const SCORE_BY_STATUS: Record<CheckStatus, number> = {
  pass: 100,
  warn: 50,
  fail: 0,
};

function usesLatestTag(image?: string) {
  if (!image) {
    return false;
  }
  if (image.includes('@sha256:')) {
    return false;
  }
  const lastSegment = image.split('/').pop() || '';
  const tag = lastSegment.includes(':') ? lastSegment.split(':').pop() : '';
  return !tag || tag === 'latest';
}

export function getSecurityChecks(c: InspectLike): SecurityCheck[] {
  const host = c.HostConfig || {};

  const hasMemoryLimit = !!host.Memory && host.Memory > 0;
  const privileged = !!host.Privileged;

  const socketMounted =
    (c.Mounts || []).some((m) => m.Source?.includes('docker.sock')) ||
    (host.Binds || []).some((b) => b.includes('docker.sock'));

  const openPorts = Object.entries(host.PortBindings || {}).flatMap(
    ([, bindings]) =>
      (bindings || [])
        .filter((b) => !b.HostIp || b.HostIp === '0.0.0.0' || b.HostIp === '::')
        .map((b) => b.HostPort)
        .filter(Boolean)
  );

  const user = c.Config?.User;
  const runsAsRoot = !user || user === 'root' || user === '0';
  const readonlyRoot = !!host.ReadonlyRootfs;
  const image = c.Config?.Image || '';
  const latestTag = usesLatestTag(image);

  return [
    {
      id: 'memory',
      title: hasMemoryLimit ? 'Memory limit set' : 'No memory limit',
      description: hasMemoryLimit
        ? 'A memory limit protects the host from this container'
        : "Set a limit so one container can't starve the host",
      risk: 'A container without a limit can use all the host memory and crash other containers.',
      fix: 'Run it with --memory 256m (choose a value that fits your app).',
      status: hasMemoryLimit ? 'pass' : 'fail',
    },
    {
      id: 'privileged',
      title: privileged ? 'Privileged mode is on' : 'Not privileged',
      description: privileged
        ? 'Privileged containers have almost full access to the host'
        : 'Privileged mode is off',
      risk: 'Privileged mode removes most isolation, so a compromised container can take over the host.',
      fix: 'Remove --privileged and add only the specific capabilities you need with --cap-add.',
      status: privileged ? 'fail' : 'pass',
    },
    {
      id: 'socket',
      title: socketMounted ? 'Docker socket mounted' : 'Docker socket not mounted',
      description: socketMounted
        ? 'Gives this container control over the whole host'
        : 'The container cannot control the Docker daemon',
      risk: 'Whoever controls this container can control Docker, and therefore the whole host.',
      fix: "Do not mount /var/run/docker.sock unless the container really needs it, or put a Docker socket proxy in front of it.",
      status: socketMounted ? 'warn' : 'pass',
    },
    {
      id: 'ports',
      title: openPorts.length
        ? 'Ports open on all interfaces'
        : 'No ports exposed on all interfaces',
      description: openPorts.length
        ? `${openPorts.join(' and ')} listen on 0.0.0.0`
        : 'No published ports listen on every interface',
      risk: 'Ports on 0.0.0.0 are reachable from every network the host is connected to, not only from your machine.',
      fix: 'Bind to localhost, for example -p 127.0.0.1:8080:80, or put a firewall or reverse proxy in front.',
      status: openPorts.length ? 'warn' : 'pass',
    },
    {
      id: 'root',
      title: runsAsRoot ? 'Runs as root' : 'Runs as non-root user',
      description: runsAsRoot
        ? 'The main process runs as the root user'
        : `Running as user "${user}"`,
      risk: 'If an attacker breaks into the app, they become root inside the container, which makes escaping easier.',
      fix: 'Run as a normal user with --user 1000, or set USER in the Dockerfile.',
      status: runsAsRoot ? 'warn' : 'pass',
    },
    {
      id: 'readonly',
      title: readonlyRoot
        ? 'Read-only root filesystem'
        : 'Writable root filesystem',
      description: readonlyRoot
        ? 'The container cannot modify its own filesystem'
        : 'Consider making the root filesystem read-only',
      risk: 'A bug or malware can modify the container files, install tools, or hide changes.',
      fix: 'Add --read-only, and use --tmpfs /tmp or a volume for folders that must be writable.',
      status: readonlyRoot ? 'pass' : 'warn',
    },
    {
      id: 'latest',
      title: latestTag ? 'Image tag is latest' : 'Image tag is pinned',
      description: latestTag
        ? `Image "${image}" has no fixed version`
        : `Image "${image}"`,
      risk: 'The latest tag changes over time, so you cannot know which version is running and an update can break things silently.',
      fix: 'Pin a specific version such as nginx:1.27, or an image digest (@sha256:...).',
      status: latestTag ? 'warn' : 'pass',
    },
  ];
}

export function getScore(checks: SecurityCheck[]) {
  if (checks.length === 0) {
    return 0;
  }
  const total = checks.reduce((sum, c) => sum + SCORE_BY_STATUS[c.status], 0);
  return Math.round(total / checks.length);
}
