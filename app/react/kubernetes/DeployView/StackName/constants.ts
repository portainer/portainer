// this regex is to satisfy k8s label validation rules
// alphanumeric, lowercase, uppercase, can contain dashes, dots and underscores, max 63 characters
export const KUBE_STACK_NAME_VALIDATION_REGEX =
  /^(([a-zA-Z0-9](?:(?:[-a-zA-Z0-9_.]){0,61}[a-zA-Z0-9])?))$/;
