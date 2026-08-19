import _ from 'lodash';
import YAML from 'yaml';

/**
 * Extracts all container names from a Docker Compose YAML string
 * @param yaml - The YAML content to parse
 * @returns Array of unique container names found in the YAML
 */
export function extractContainerNames(yaml = ''): string[] {
  let yamlObject;

  try {
    yamlObject = YAML.parse(yaml, { maxAliasCount: 10000 });
  } catch (err) {
    return [];
  }

  return extractContainerNamesFromYaml(yamlObject);
}

/**
 * Extracts all container names from a Docker Compose YAML object
 * @param yaml - The YAML object
 * @returns Array of unique container names found in the YAML
 */
export function extractContainerNamesFromYaml(yaml: unknown): string[] {
  return _.uniq(findDeepAll<string>(yaml, 'container_name'));
}

/**
 * Recursively finds all values for a given key in a nested object structure
 * @param obj - The object to search
 * @param target - The key to find
 * @param res - Accumulator for results (used internally)
 * @returns Array of all values found for the target key
 */
function findDeepAll<T = unknown>(
  obj: unknown,
  target: string,
  res: T[] = []
): T[] {
  if (typeof obj === 'object' && obj !== null) {
    _.forEach(obj as Record<string, unknown>, (child, key) => {
      if (key === target) {
        res.push(child as T);
      }
      if (typeof child === 'object' && child !== null) {
        findDeepAll(child, target, res);
      }
    });
  }
  return res;
}
