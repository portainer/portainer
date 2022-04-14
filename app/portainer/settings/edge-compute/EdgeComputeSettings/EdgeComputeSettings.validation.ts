import { boolean, number, object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    EdgeAgentCheckinInterval: number().required('This field is required.'),
    EnableEdgeComputeFeatures: boolean().required('This field is required.'),
    DisableTrustOnFirstConnect: boolean().required('This field is required.'),
    EnforceEdgeID: boolean().required('This field is required.'),
    EdgePortainerUrl: string()
      .test(
        'notlocal',
        'Cannot use localhost as environment URL',
        (value) => !value?.includes('localhost')
      )
      .url('URL should be a valid URI')
      .required('URL is required'),
  });
}
