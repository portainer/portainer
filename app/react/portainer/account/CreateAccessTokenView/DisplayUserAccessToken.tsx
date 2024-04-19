import { useRouter } from '@uirouter/react';

import { Button, CopyButton } from '@@/buttons';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { TextTip } from '@@/Tip/TextTip';

export function DisplayUserAccessToken({ apikey }: { apikey: string }) {
  const router = useRouter();
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
        type="button"
        data-cy="create-access-token-done-button"
        onClick={() => router.stateService.go('portainer.account')}
      >
        Done
      </Button>
    </>
  );
}
