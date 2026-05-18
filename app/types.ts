export interface AutomationTestingProps {
  /**
   * Used by cypress to identify this property.
   *
   * Change with care and communicate this with QA
   */
  'data-cy': string;
}

declare module 'react' {
  interface HTMLAttributes<T>
    extends AriaAttributes, DOMAttributes<T>, Partial<AutomationTestingProps> {
    // keep AutomationTestingProps 'data-cy' optional because HTMLAttributes covers non interactive elements
  }
}

export type WithRequiredProperties<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ValueOf<T extends Record<string, unknown>> = T[keyof T];

/**
 * Recursively makes all properties of a type optional, including nested objects.
 * Unlike TypeScript's built-in Partial<T> which only affects top-level properties,
 * DeepPartial applies the optional modifier to all levels of nested objects.
 *
 * @example
 * ```ts
 * interface Config {
 *   name: string;
 *   settings: {
 *     theme: string;
 *     options: {
 *       darkMode: boolean;
 *     };
 *   };
 * }
 *
 * // All properties at all levels are now optional
 * type PartialConfig = DeepPartial<Config>;
 * // Equivalent to:
 * type PartialConfig = {
 *   name?: string;
 *   settings?: {
 *     theme?: string;
 *     options?: {
 *       darkMode?: boolean;
 *     };
 *   };
 * }
 * ```
 */
export type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
