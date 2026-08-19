// exporting as types here allows the JSDocs to be reused, improving readability

/**
 * The revision number of the latest release.
 */
export type LatestRevisionNumber = number;

/**
 * The revision number selected in the UI.
 */
export type SelectedRevisionNumber = number;

/**
 * The revision number to compare with.
 */
export type CompareRevisionNumber = number;

/**
 * The earliest revision number available for the chart.
 */
export type EarliestRevisionNumber = number;

/**
 * The revision number that's being fetched (instead of the form state).
 */
export type CompareRevisionNumberFetched = number;
