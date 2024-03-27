import { Button, CopyButton } from '@@/buttons';
import { FormSection } from '@@/form-components/FormSection';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

export function DisplayUserAccessToken({ apiKey }: { apiKey: string }) {
  return (
    <FormSection title="New access token">
      <TextTip>
        Please copy the new access token. You won&#39;t be able to view the
        token again.
      </TextTip>

      <div className="pt-5">
        <div className="inline-flex">
          <div aria-label="api key">{apiKey}</div>
          <div>
            <CopyButton copyText={apiKey} color="link" />
          </div>
        </div>
        <hr />
      </div>

      <Button as={Link} props={{ to: 'portainer.account' }}>
        Done
      </Button>
    </FormSection>
  );
}
