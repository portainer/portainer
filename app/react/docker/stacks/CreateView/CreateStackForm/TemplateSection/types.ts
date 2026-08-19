export interface TemplateFormValues {
  selectedId: number | undefined;
  variables: Array<{ key: string; value: string }>;
  fileContent: string;
}
