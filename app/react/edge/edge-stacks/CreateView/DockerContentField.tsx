import { useDockerComposeSchema } from '@/react/hooks/useDockerComposeSchema/useDockerComposeSchema';

import { InlineLoader } from '@@/InlineLoader';
import { WebEditorForm } from '@@/WebEditorForm';

export function DockerContentField({
  error,
  onChange,
  readonly,
  value,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  readonly?: boolean;
  isLoading?: boolean;
}) {
  const dockerComposeSchemaQuery = useDockerComposeSchema();

  if (isLoading || dockerComposeSchemaQuery.isInitialLoading) {
    return <InlineLoader>Loading stack content...</InlineLoader>;
  }

  return (
    <WebEditorForm
      id="stack-creation-editor"
      value={value}
      onChange={onChange}
      type="yaml"
      textTip="Define or paste the content of your docker compose file here"
      error={error}
      readonly={readonly}
      schema={dockerComposeSchemaQuery.data}
      data-cy="stack-creation-editor"
    >
      You can get more information about Compose file format in the{' '}
      <a
        href="https://docs.docker.com/reference/compose-file/"
        target="_blank"
        rel="noreferrer"
      >
        official documentation
      </a>
      .
    </WebEditorForm>
  );
}
