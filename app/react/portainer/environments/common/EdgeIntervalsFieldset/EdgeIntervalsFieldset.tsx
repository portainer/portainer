import { EdgeCheckinIntervalField } from '@/react/edge/components/EdgeCheckInIntervalField';
import { EdgeAsyncIntervalsForm } from '@/react/edge/components/EdgeAsyncIntervalsForm';

import { FormSection } from '@@/form-components/FormSection';

import {
  EdgeIntervalsValues,
  toAsyncIntervalsValues,
  fromAsyncIntervalsValues,
} from './types';

interface Props {
  /** Current interval values */
  value: EdgeIntervalsValues;
  /** Callback when intervals change */
  onChange: (value: EdgeIntervalsValues) => void;
  /** Whether the agent is in async mode (determines which interval fields to show) */
  asyncMode: boolean;
  /** Whether fields should be read-only */
  readonly?: boolean;
  /** Optional custom section title */
  title?: string;
}

/**
 * EdgeIntervalsFieldset displays the appropriate check-in interval fields
 * based on whether the Edge agent is in sync or async mode.
 *
 * - Sync mode: Shows a single poll frequency selector (EdgeCheckinIntervalField)
 * - Async mode: Shows ping, snapshot, and command interval selectors (EdgeAsyncIntervalsForm)
 */
export function EdgeIntervalsFieldset({
  value,
  onChange,
  asyncMode,
  readonly = false,
  title = 'Check-in Intervals',
}: Props) {
  return (
    <FormSection title={title}>
      {asyncMode ? (
        <EdgeAsyncIntervalsForm
          values={toAsyncIntervalsValues(value)}
          readonly={readonly}
          onChange={(asyncValues) => {
            onChange(fromAsyncIntervalsValues(value, asyncValues));
          }}
        />
      ) : (
        <EdgeCheckinIntervalField
          value={value.checkinInterval}
          readonly={readonly}
          onChange={(checkinInterval) =>
            onChange({ ...value, checkinInterval })
          }
        />
      )}
    </FormSection>
  );
}
