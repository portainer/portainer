import YAML from 'yaml';
import _ from 'lodash';

import { extractContainerNamesFromYaml } from './container-names';

/**
 * Validates Docker Compose YAML content
 * @param yaml - The YAML content to validate
 * @param containerNames - Array of container names currently running in the environment
 * @param originalContainerNames - Array of original container names from the stack (before edit)
 * @returns Error message if validation fails, empty string if valid
 */
export function validateYAML(
  yaml: string,
  containerNames: string[] = [],
  originalContainerNames: string[] = []
): string {
  let yamlObject;

  try {
    yamlObject = YAML.parse(yaml, { maxAliasCount: 10000 });
  } catch (err) {
    return `There is an error in the yaml syntax: ${err}`;
  }

  const names = extractContainerNamesFromYaml(yamlObject);

  // Find containers that are:
  // 1. In the current environment (containerNames)
  // 2. NOT in the original stack (originalContainerNames)
  // 3. Present in the new YAML (names)
  // This identifies conflicts with other stacks/containers
  const duplicateContainers = _.intersection(
    _.difference(containerNames, originalContainerNames),
    names
  );

  if (duplicateContainers.length === 0) {
    return '';
  }

  return `${
    duplicateContainers.length === 1
      ? 'This container name is'
      : 'These container names are'
  } already used by another container running in this environment: ${_.join(
    duplicateContainers,
    ', '
  )}.`;
}

/**
 * Checks if the YAML content has changed (ignoring line ending differences)
 * @param original - Original YAML content
 * @param updated - Updated YAML content
 * @returns True if content has changed, false otherwise
 */
export function hasYamlChanged(original: string, updated: string): boolean {
  return normalizeLineEndings(original) !== normalizeLineEndings(updated);

  function normalizeLineEndings(str: string) {
    return str.replace(/(\r\n|\n|\r)/gm, '');
  }
}
