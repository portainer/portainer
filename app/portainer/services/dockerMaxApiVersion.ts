// Key used in axios types definitions
export const MaxDockerAPIVersionKey = 'maxDockerAPIVersion' as const;

export type DockerAPIVersionType = number;

// this is the version we are using with the generated API types
export const MAX_DOCKER_API_VERSION: DockerAPIVersionType = 1.44;
