export interface AutomationTestingProps {
  /**
   * Used by cypress to identify this property.
   *
   * Change with care and communicate this with QA
   */
  'data-cy'?: string;
}

declare module 'react' {
  interface HTMLAttributes<T>
    extends AriaAttributes,
      DOMAttributes<T>,
      AutomationTestingProps {}
}

export type WithRequiredProperties<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type ValueOf<T extends Record<string, unknown>> = T[keyof T];
