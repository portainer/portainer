import axios, {
  jsonObjectsToArrayHandler,
  parseAxiosError,
} from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import { formatArrayQueryParamsForDockerAPI } from '../../proxy/queries/utils';

export async function buildImageFromUpload(
  environmentId: EnvironmentId,
  names: string[],
  file: File,
  path: string
) {
  return buildImage(
    environmentId,
    { t: names, dockerfile: path },
    file,
    file.type
  );
}

export async function buildImageFromURL(
  environmentId: EnvironmentId,
  names: string[],
  url: string,
  path: string
) {
  return buildImage(
    environmentId,
    { t: names, remote: url, dockerfile: path },
    {},
    'application/x-tar'
  );
}

export async function buildImageFromDockerfileContent(
  environmentId: EnvironmentId,
  names: string[],
  content: string
) {
  return buildImage(
    environmentId,
    { t: names },
    { content },
    'application/json'
  );
}

export async function buildImageFromDockerfileContentAndFiles(
  environmentId: EnvironmentId,
  names: string[],
  content: string,
  files: File[]
) {
  const dockerfile = new Blob([content], { type: 'text/plain' });
  const uploadFiles = [dockerfile, ...files];

  const formData = new FormData();
  uploadFiles.forEach((file, index) => {
    formData.append(`file${index}`, file);
  });

  return buildImage(
    environmentId,
    { t: names },
    formData,
    'multipart/form-data'
  );
}

/**
 * Raw docker API proxy
 *
 * -----
 *
 * See api/http/proxy/factory/docker/build.go for the rules (copied below)
 *
 * buildOperation inspects the "Content-Type" header to determine if it needs to alter the request.
 *
 * -- buildImageFromUpload()
 * If the value of the header is empty, it means that a Dockerfile is posted via upload, the function
 * will extract the file content from the request body, tar it, and rewrite the body.
 * !! THIS IS ONLY TRUE WHEN THE UPLOADED DOCKERFILE FILE HAS NO EXTENSION (the generated file.type in the frontend will be empty)
 * If the Dockerfile is named like Dockerfile.yaml or has an internal type, a non-empty Content-Type header will be generated
 *
 * -- buildImageFromDockerfileContent()
 * If the value of the header contains "application/json", it means that the content of a Dockerfile is posted
 * in the request payload as JSON, the function will create a new file called Dockerfile inside a tar archive and
 * rewrite the body of the request.
 *
 * -- buildImageFromUpload()
 * -- buildImageFromURL()
 * -- buildImageFromDockerfileContentAndFiles()
 * In any other case, it will leave the request unaltered.
 *
 * -----
 *
 * @param environmentId
 * @param params
 * @param payload
 * @param contentType
 */
async function buildImage(
  environmentId: EnvironmentId,
  params: BuildImageQueryParams,
  payload: unknown,
  contentType: string
) {
  try {
    const { data } = await axios.post(
      buildDockerProxyUrl(environmentId, 'build'),
      payload,
      {
        headers: { 'Content-Type': contentType },
        params,
        transformResponse: jsonObjectsToArrayHandler,
        paramsSerializer: formatArrayQueryParamsForDockerAPI,
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to build image');
  }
}

type BuildImageQueryParams = {
  /**
   * Path within the build context to the Dockerfile.
   * This is ignored if remote is specified and points to an external Dockerfile.
   *
   * @default "Dockerfile"
   */
  dockerfile?: string;

  /**
   * A name and optional tag to apply to the image in the name:tag format.
   * If you omit the tag the default latest value is assumed.
   * You can provide several t parameters.
   */
  t?: string[];

  /**
   * Extra hosts to add to /etc/hosts
   */
  extrahost?: string;

  /**
   * A Git repository URI or HTTP/HTTPS context URI.
   * If the URI points to a single text file, the file’s contents are placed into a file called Dockerfile and the image is built from that file.
   * If the URI points to a tarball, the file is downloaded by the daemon and the contents therein used as the context for the build.
   * If the URI points to a tarball and the dockerfile parameter is also specified, there must be a file with the corresponding path inside the tarball.
   */
  remote?: string;

  /**
   * Suppress verbose build output.
   *
   * @default false
   */
  q?: boolean;

  /**
   * Do not use the cache when building the image.
   *
   * @default false
   */
  nocache?: boolean;

  /**
   * JSON array of images used for build cache resolution.
   */
  cachefrom?: string[];

  /**
   * Attempt to pull the image even if an older image exists locally.
   */
  pull?: string;

  /**
   * Remove intermediate containers after a successful build.
   *
   * @default true
   */
  rm?: boolean;

  /**
   * Always remove intermediate containers, even upon failure.
   *
   * @default false
   */
  forcerm?: boolean;

  /**
   * Set memory limit for build.
   */
  memory?: number;

  /**
   * Total memory (memory + swap).
   *
   * Set as -1 to disable swap.
   */
  memswap?: number;

  /**
   * CPU shares (relative weight).
   */
  cpushares?: number;

  /**
   * CPUs in which to allow execution (e.g., 0-3, 0,1).
   */
  cpusetcpus?: string;

  /**
   * The length of a CPU period in microseconds.
   */
  cpuperiod?: number;

  /**
   * Microseconds of CPU time that the container can get in a CPU period.
   */
  cpuquota?: number;

  /**
   * JSON map of string pairs for build-time variables. Users pass these values at build-time.
   * Docker uses the buildargs as the environment context for commands run via the Dockerfile RUN instruction, or for variable expansion in other Dockerfile instructions.
   * This is not meant for passing secret values.
   * For example, the build arg FOO=bar would become {"FOO":"bar"} in JSON. This would result in the query parameter buildargs={"FOO":"bar"}.
   * Note that {"FOO":"bar"} should be URI component encoded.
   * Read more about the buildargs instruction.
   */
  buildargs?: string;

  /**
   * Size of /dev/shm in bytes. The size must be greater than 0. If omitted the system uses 64MB.
   */
  shmsize?: number;

  /**
   * Squash the resulting images layers into a single layer. (Experimental release only.)
   */
  squash?: boolean;

  /**
   * Arbitrary key/value labels to set on the image, as a JSON map of string pairs.
   */
  labels?: Record<string, string>;

  /**
   * Sets the networking mode for the run commands during build. Supported standard values are: bridge, host, none, and container:<name|id>.
   * Any other value is taken as a custom network's name or ID to which this container should connect to.
   */
  networkmode?: string;

  /**
   * Platform in the format os[/arch[/variant]]
   *
   * @default ""
   */
  platform?: string;

  /**
   * Target build stage
   *
   * @default ""
   */
  target?: string;

  /**
   * BuildKit output configuration
   *
   * @default ""
   */
  outputs?: string;

  /**
   * Version of the builder backend to use.
   *
   * @enum {('1' | '2')}
   *
   * @default '1'
   *
   * - 1 is the first generation classic (deprecated) builder in the Docker daemon (default)
   * - 2 is BuildKit
   */
  version?: string;
};
