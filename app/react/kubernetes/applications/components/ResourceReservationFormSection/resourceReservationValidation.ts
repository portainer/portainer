import { SchemaOf, TestContext, number, object } from 'yup';

import KubernetesResourceReservationHelper from '@/kubernetes/helpers/resourceReservationHelper';
import { nanNumberSchema } from '@/react-tools/yup-schemas';

import { ResourceQuotaFormValues } from './types';

type NodeLimit = {
  CPU: number;
  Memory: number;
};

type NodesLimits = Record<string, NodeLimit>;

type ValidationData = {
  maxMemoryLimit: number;
  maxCpuLimit: number;
  isEnvironmentAdmin: boolean;
  nodeLimits: NodesLimits;
  isExistingCPUReservationUnchanged: boolean;
  isExistingMemoryReservationUnchanged: boolean;
};

export function resourceReservationValidation(
  validationData?: ValidationData
): SchemaOf<ResourceQuotaFormValues> {
  return object().shape({
    memoryLimit: nanNumberSchema('Memory limit is required.')
      .min(0, 'Value must be greater than or equal to 0.')
      .test(
        'exhaused',
        `The memory capacity for this namespace has been exhausted, so you cannot deploy the application.${
          validationData?.isEnvironmentAdmin
            ? ''
            : ' Contact your administrator to expand the memory capacity of the namespace.'
        }`,
        () => !!validationData && validationData.maxMemoryLimit > 0
      )
      .max(validationData?.maxMemoryLimit || 0, ({ value }) =>
        // when the existing reservation is unchanged and exceeds the new limit, show a different error message
        // https://portainer.atlassian.net/browse/EE-5933?focusedCommentId=29308
        validationData?.isExistingMemoryReservationUnchanged
          ? `Value must be between 0 and ${validationData?.maxMemoryLimit}MB now - the previous value of ${value} exceeds this.`
          : `Value must be between 0 and ${validationData?.maxMemoryLimit}MB.`
      )
      .test(
        'hasSuitableNode',
        `These reservations would exceed the resources currently available in the cluster.`,
        (value: number | undefined, context: TestContext) => {
          if (!validationData || value === undefined) {
            // explicitely check for undefined, since 0 is a valid value
            return true;
          }
          const { memoryLimit, cpuLimit } = context.parent;
          return hasSuitableNode(
            memoryLimit,
            cpuLimit,
            validationData.nodeLimits
          );
        }
      )
      .required('Memory limit is required.'),
    cpuLimit: number()
      .min(0)
      .test(
        'exhaused',
        `The CPU capacity for this namespace has been exhausted, so you cannot deploy the application.${
          validationData?.isEnvironmentAdmin
            ? ''
            : ' Contact your administrator to expand the CPU capacity of the namespace.'
        }`,
        () => !!validationData && validationData.maxCpuLimit > 0
      )
      .max(validationData?.maxCpuLimit || 0, ({ value }) =>
        // when the existing reservation is unchanged and exceeds the new limit, show a different error message
        // https://portainer.atlassian.net/browse/EE-5933?focusedCommentId=29308
        validationData?.isExistingCPUReservationUnchanged
          ? `Value must be between 0 and ${validationData?.maxCpuLimit} now - the previous value of ${value} exceeds this.`
          : `Value must be between 0 and ${validationData?.maxCpuLimit}.`
      )
      .test(
        'hasSuitableNode',
        `These reservations would exceed the resources currently available in the cluster.`,
        (value: number | undefined, context: TestContext) => {
          if (!validationData || value === undefined) {
            // explicitely check for undefined, since 0 is a valid value
            return true;
          }
          const { memoryLimit, cpuLimit } = context.parent;
          return hasSuitableNode(
            memoryLimit,
            cpuLimit,
            validationData.nodeLimits
          );
        }
      )
      .required(),
  });
}

function hasSuitableNode(
  memoryLimit: number,
  cpuLimit: number,
  nodeLimits: NodesLimits
) {
  const nanParsedMemoryLimit = Number.isNaN(memoryLimit) ? 0 : memoryLimit;
  const nanParsedCPULimit = Number.isNaN(cpuLimit) ? 0 : cpuLimit;
  // transform the nodelimits from bytes to MB
  const limits = Object.values(nodeLimits).map((nodeLimit) => ({
    ...nodeLimit,
    Memory: KubernetesResourceReservationHelper.megaBytesValue(
      nodeLimit.Memory
    ),
  }));
  // make sure there's a node available with enough memory and cpu
  return limits.some(
    (nodeLimit) =>
      nodeLimit.Memory >= nanParsedMemoryLimit &&
      nodeLimit.CPU >= nanParsedCPULimit
  );
}
