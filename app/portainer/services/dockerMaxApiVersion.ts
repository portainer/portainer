// Key used in axios types definitions
export const MaxDockerAPIVersionKey = 'maxDockerAPIVersion' as const;

export type DockerAPIVersionType = number;

// this is the version we are using with the generated API types
export const MAX_DOCKER_API_VERSION: DockerAPIVersionType = 1.41;

// https://docs.docker.com/engine/api/#api-version-matrix
// Docker 26 = API 1.45
export const LATEST_DOCKER_API_VERSION: DockerAPIVersionType = 1.45;
