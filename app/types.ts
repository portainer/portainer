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
