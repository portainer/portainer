import { CopyButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { Code } from '@@/Code';

export function EdgeKeyDisplay({ edgeKey }: { edgeKey: string }) {
  return (
    <FormSection title="Join token">
      <TextTip color="blue">
        For those pre-staging the edge agent, use the following join token to
        associate the Edge agent with this environment.
      </TextTip>

      <p className="small text-muted mt-2">
        You can read more about pre-staging in the user-guide available{' '}
        <a href="https://downloads.portainer.io/edge_agent_guide.pdf">here.</a>
      </p>

      <Code>{edgeKey}</Code>

      <CopyButton
        copyText={edgeKey}
        className="mt-2"
        data-cy="copy-edge-key-button"
      >
        Copy token
      </CopyButton>
    </FormSection>
  );
}
