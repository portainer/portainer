import { UpdatePayload } from '../../queries/useUpdateEdgeJobMutation';
import { toRecurringRequest } from '../../components/EdgeJobForm/parseRecurringValues';

import { FormValues } from './types';

export function getPayload(values: FormValues): UpdatePayload {
  return {
    name: values.name,
    edgeGroups: values.edgeGroupIds,
    endpoints: values.environmentIds,
    fileContent: values.fileContent,
    ...toRecurringRequest(values),
  };
}
