import {
  EdgeAsyncIntervalsValues,
  EDGE_ASYNC_INTERVAL_USE_DEFAULT,
} from '@/react/edge/components/EdgeAsyncIntervalsForm';

/**
 * Internal form values for edge check-in intervals.
 * Uses lowerCamelCase for consistency with Formik/frontend conventions.
 */
export interface EdgeIntervalsValues {
  /** Sync mode check-in interval (maps to EdgeCheckinInterval in API) */
  checkinInterval: number;
  /** Async mode ping interval */
  pingInterval: number;
  /** Async mode snapshot interval */
  snapshotInterval: number;
  /** Async mode command interval */
  commandInterval: number;
}

/**
 * Default values for edge intervals form
 */
export function getDefaultEdgeIntervalsValues(): EdgeIntervalsValues {
  return {
    checkinInterval: 0, // Use default
    pingInterval: EDGE_ASYNC_INTERVAL_USE_DEFAULT,
    snapshotInterval: EDGE_ASYNC_INTERVAL_USE_DEFAULT,
    commandInterval: EDGE_ASYNC_INTERVAL_USE_DEFAULT,
  };
}

/**
 * Convert EdgeIntervalsValues to EdgeAsyncIntervalsValues (PascalCase for existing component)
 */
export function toAsyncIntervalsValues(
  values: EdgeIntervalsValues
): EdgeAsyncIntervalsValues {
  return {
    PingInterval: values.pingInterval,
    SnapshotInterval: values.snapshotInterval,
    CommandInterval: values.commandInterval,
  };
}

/**
 * Convert EdgeAsyncIntervalsValues (PascalCase) back to EdgeIntervalsValues
 */
export function fromAsyncIntervalsValues(
  values: EdgeIntervalsValues,
  asyncValues: EdgeAsyncIntervalsValues
): EdgeIntervalsValues {
  return {
    ...values,
    pingInterval: asyncValues.PingInterval,
    snapshotInterval: asyncValues.SnapshotInterval,
    commandInterval: asyncValues.CommandInterval,
  };
}
