import { PropsWithChildren, useEffect, useState } from 'react';
import { useRouter } from '@uirouter/react';

import { Widget, WidgetBody } from '@/portainer/components/widget';
import { FormControl } from '@/portainer/components/form-components/FormControl';
import { TextInput } from '@/portainer/components/form-components/Input';
import { Button } from '@/portainer/components/Button';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Code } from '@/portainer/components/Code';
import { CopyButton } from '@/portainer/components/Button/CopyButton';

import styles from './CreateAccessToken.module.css';

interface AccessTokenResponse {
  rawAPIKey: string;
}

export interface Props {
  // userId for whom the access token is generated for
  userId: number;

  // onSubmit dispatches a successful matomo analytics event
  onSubmit: (description: string) => Promise<AccessTokenResponse>;

  // onError is called when an error occurs; this is a callback to Notifications.error
  onError: (heading: string, err: unknown, message: string) => void;
}

export function CreateAccessToken({
  onSubmit,
  onError,
}: PropsWithChildren<Props>) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (description.length === 0) {
      setErrorText('this field is required');
    } else setErrorText('');
  }, [description]);

  async function generateAccessToken() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await onSubmit(description);
      setAccessToken(response.rawAPIKey);
    } catch (err) {
      onError('Failure', err, 'Failed to generate access token');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Widget>
      <WidgetBody>
        <div>
          <FormControl inputId="input" label="Description" errors={errorText}>
            <TextInput
              id="input"
              onChange={(value) => setDescription(value)}
              type="text"
              value={description}
            />
          </FormControl>
          <Button
            disabled={!!errorText || !!accessToken}
            onClick={generateAccessToken}
            className={styles.addButton}
          >
            Add access token
          </Button>
        </div>
        {accessToken && (
          <>
            <FormSectionTitle>New access token</FormSectionTitle>
            <TextTip>
              Please copy the new access token. You won&#39;t be able to view
              the token again.
            </TextTip>
            <Code>{accessToken}</Code>
            <CopyButton
              copyText={accessToken}
              className={styles.copyButton}
              displayText=""
            >
              Copy access token
            </CopyButton>
            <hr />
            <Button
              type="button"
              onClick={() => router.stateService.go('portainer.account')}
            >
              Done
            </Button>
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
