import { Button, CopyButton } from '@@/buttons';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

export function DisplayUserAccessToken({ apikey }: { apikey: string }) {
  return (
    <>
      <FormSectionTitle>New access token</FormSectionTitle>
      <TextTip>
        Please copy the new access token. You won&#39;t be able to view the
        token again.
      </TextTip>
      <div className="pt-5">
        <div className="inline-flex">
          <div className="">{apikey}</div>
          <div>
            <CopyButton
              copyText={apikey}
              color="link"
              data-cy="create-access-token-copy-button"
            />
          </div>
        </div>
        <hr />
      </div>
      <Button
        as={Link}
        props={{
          to: 'portainer.account',
        }}
        data-cy="create-access-token-done-button"
      >
        Done
      </Button>
    </>
  );
}
