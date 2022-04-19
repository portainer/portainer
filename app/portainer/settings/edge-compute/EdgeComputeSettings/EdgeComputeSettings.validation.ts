import { boolean, number, object } from 'yup';

export function validationSchema() {
  return object().shape({
    EdgeAgentCheckinInterval: number().required('This field is required.'),
    EnableEdgeComputeFeatures: boolean().required('This field is required.'),
    EnforceEdgeID: boolean().required('This field is required.'),
  });
}
