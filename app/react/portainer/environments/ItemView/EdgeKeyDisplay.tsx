import { CopyButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';

export function EdgeKeyDisplay({ edgeKey }: { edgeKey: string }) {
  return (
    <FormSection title="Join token">
      <TextTip color="blue">
        For those pre-staging the edge agent, use the following join token to
        associate the Edge agent with this environment.
      </TextTip>

      <p className="small text-muted">
        You can read more about pre-staging in the user-guide available{' '}
        <a href="https://downloads.portainer.io/edge_agent_guide.pdf">here.</a>
      </p>

      <div className="mt-2 break-words">
        <code>{edgeKey}</code>
      </div>

      <CopyButton copyText={edgeKey}>Copy token</CopyButton>
    </FormSection>
  );
}
