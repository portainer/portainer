import { agentTargetHeader } from '@/portainer/services/axios';
import { RegistryId } from '@/react/portainer/registries/types/registry';

/**
 * Generates the `filters` query param entry for docker API list actions
 *
 * @param filters map[string][]string
 * @returns `{ filters: filters && JSON.stringify(filters) }`
 */
export function withFiltersQueryParam<T = unknown>(filters?: T) {
  return { filters: filters && JSON.stringify(filters) };
}

/**
 * Encodes the registry credentials in base64
 * @param registryId
 * @returns
 */
function encodeRegistryCredentials(registryId: RegistryId) {
  return window.btoa(JSON.stringify({ registryId }));
}

/**
 * Generates the `X-Registry-Auth` header for docker API
 * @param registryId The registry Id to use
 * @returns
 */
export function withRegistryAuthHeader(registryId?: RegistryId) {
  return registryId !== undefined
    ? { 'X-Registry-Auth': encodeRegistryCredentials(registryId) }
    : {};
}

/**
 * Generates the `X-PortainerAgent-Target` header
 * @param nodeName The node name to target
 * @returns
 */
export function withAgentTargetHeader(nodeName?: string) {
  return nodeName ? { [agentTargetHeader]: nodeName } : {};
}

/**
 * Generates the `'X-PortainerAgent-ManagerOperation'` header
 * @param managerOperation
 * @returns
 */
export function withAgentManagerOperationHeader(managerOperation?: boolean) {
  return managerOperation ? { 'X-PortainerAgent-ManagerOperation': '1' } : {};
}

/**
 * The Docker API expects array query params as `param = value_1 & param = value_2`
 * axios default serializer generates `names[] = value_1 & names[] = value_2`
 * which are ignored by the Docker API
 * @param params
 * @returns the concatenated string of query params with Docker expected format
 */
export function formatArrayQueryParamsForDockerAPI(
  params: Record<string, unknown>
) {
  return Object.entries(params)
    .flatMap(([param, value]) =>
      (Array.isArray(value) ? value : [value]).map((v) => `${param}=${v}`)
    )
    .join('&');
}
