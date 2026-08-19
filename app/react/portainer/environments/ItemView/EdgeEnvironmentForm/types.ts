import { EdgeIntervalsValues } from '../../common/EdgeIntervalsFieldset/types';
import { EnvironmentMetadata } from '../../environment.service/create';

export interface EdgeEnvironmentFormValues {
  /** Environment name */
  name: string;

  /** Public URL for the environment */
  publicUrl: string;

  /** Edge check-in interval settings */
  edge: EdgeIntervalsValues;

  /** Metadata (required by MetadataFieldset) */
  meta: EnvironmentMetadata;
}
