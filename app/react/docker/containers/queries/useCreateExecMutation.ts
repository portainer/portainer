import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { ContainerId } from '../types';

type ExecConfig = {
  AttachStdin: boolean; // Attach to stdin of the exec command.
  AttachStdout: boolean; // Attach to stdout of the exec command.
  AttachStderr: boolean; // Attach to stderr of the exec command.
  DetachKeys: string; // Override the key sequence for detaching a container. Format is a single character [a-Z] or ctrl-<value> where <value> is one of: a-z, @, ^, [, , or _.
  Tty: boolean; // Allocate a pseudo-TTY.
  Env: string[]; // A list of environment variables in the form ["VAR=value", ...].
  Cmd: string[]; // Command to run, as a string or array of strings.
  Privileged: boolean; // Default: false - Runs the exec process with extended privileges.
  User: string; // The user, and optionally, group to run the exec process inside the container. Format is one of: user, user:group, uid, or uid:gid.
  WorkingDir: string; // The working directory for the exec process inside the container.
};
export async function createExec(
  environmentId: EnvironmentId,
  id: ContainerId,
  config: ExecConfig
) {
  try {
    const { data } = await axios.post<{ Id: string }>(
      buildDockerProxyUrl(environmentId, 'containers', id, 'exec'),
      config
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create exec');
  }
}
