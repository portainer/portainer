import { array, string, boolean, object } from 'yup';

import { buildUniquenessTest } from '@@/form-components/validate-unique';

// https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
// Labels are key/value pairs. Valid label keys have two segments: an optional prefix and name, separated by a slash (/). The name segment is required and must be 63 characters or less, beginning and ending with an alphanumeric character ([a-z0-9A-Z]) with dashes (-), underscores (_), dots (.), and alphanumerics between. The prefix is optional. If specified, the prefix must be a DNS subdomain: a series of DNS labels separated by dots (.), not longer than 253 characters in total, followed by a slash (/).
// Valid label value:
// must be 63 characters or less (can be empty),
// unless empty, must begin and end with an alphanumeric character ([a-z0-9A-Z]),
// could contain dashes (-), underscores (_), dots (.), and alphanumerics between.
const labelKeyValidation = string()
  .required('Label key is required')
  .test(
    'prefix-test',
    'Label key prefix must be a valid DNS subdomain',
    (value) => {
      if (!value) return true; // handled by required()

      const parts = value.split('/');
      if (parts.length === 1) return true; // no prefix is valid
      if (parts.length > 2) return false; // only one slash allowed

      const [prefix] = parts;

      // Prefix validation: DNS subdomain rules
      if (prefix.length > 253) return false;
      if (prefix === '') return false; // empty prefix not allowed if slash present

      // DNS subdomain: series of DNS labels separated by dots
      const labels = prefix.split('.');
      return labels.every((label) => {
        // Each DNS label must be 1-63 chars, start/end with alphanumeric, contain only alphanumeric and hyphens
        if (label.length === 0 || label.length > 63) return false;
        if (!/^[a-zA-Z0-9]/.test(label) || !/[a-zA-Z0-9]$/.test(label))
          return false;
        if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
        return true;
      });
    }
  )
  .test(
    'name-test',
    'Label key must start and end with an alphanumeric character, and contain only alphanumeric characters, hyphens, underscores, and dots',
    (value) => {
      if (!value) return true; // handled by required()

      const parts = value.split('/');
      const name = parts[parts.length - 1]; // name is always the last part

      // Name validation
      if (name.length === 0 || name.length > 63) return false;
      if (!/^[a-zA-Z0-9]/.test(name) || !/[a-zA-Z0-9]$/.test(name))
        return false;
      if (!/^[a-zA-Z0-9._-]+$/.test(name)) return false;

      return true;
    }
  );

const labelValueValidation = string()
  .max(63, 'Label value must be 63 characters or less')
  .test(
    'value-format',
    'Label value must start/end with alphanumeric and contain only alphanumeric, hyphens, underscores, and dots',
    (value) => {
      if (!value || value === '') return true; // empty values are allowed

      // Must start and end with alphanumeric
      if (!/^[a-zA-Z0-9]/.test(value) || !/[a-zA-Z0-9]$/.test(value))
        return false;

      // Can only contain alphanumeric, hyphens, underscores, and dots
      if (!/^[a-zA-Z0-9._-]+$/.test(value)) return false;

      return true;
    }
  );

const labelSchema = object({
  key: labelKeyValidation,
  value: labelValueValidation,
  needsDeletion: boolean().default(false),
  isNew: boolean().default(false),
  isUsed: boolean().default(false),
  isChanged: boolean().default(false),
});

const taintSchema = object({
  key: string().required('Taint key is required'),
  value: string(),
  effect: string()
    .oneOf(['NoSchedule', 'PreferNoSchedule', 'NoExecute'])
    .required('Effect is required'),
  needsDeletion: boolean().default(false),
  isNew: boolean().default(false),
  isChanged: boolean().default(false),
});

export function createValidationSchema(
  isOnlyNode: boolean,
  hasDrainOperation: boolean,
  containsPortainer: boolean
) {
  return object({
    availability: string()
      .oneOf(['Active', 'Pause', 'Drain'])
      .test(
        'only-node-drain',
        'Cannot drain the only node in cluster',
        (value) => {
          if (value === 'Drain' && isOnlyNode) {
            return false;
          }
          return true;
        }
      )
      .test(
        'other-node-drain',
        'Cannot drain node when another node is currently being drained',
        (value) => {
          if (value === 'Drain' && hasDrainOperation) {
            return false;
          }
          return true;
        }
      )
      .test(
        'portainer-drain',
        'Cannot drain node where the Portainer instance is running',
        (value) => {
          if (value === 'Drain' && containsPortainer) {
            return false;
          }
          return true;
        }
      )
      .required('Availability is required'),
    labels: array(labelSchema).test(
      'unique-label-keys',
      'Duplicate label keys are not allowed',
      buildUniquenessTest(() => 'This label key is already defined', 'key')
    ),
    taints: array(taintSchema).test(
      'unique-taint-keys',
      'Duplicate taint keys are not allowed',
      buildUniquenessTest(() => 'This taint key is already defined', 'key')
    ),
  });
}
