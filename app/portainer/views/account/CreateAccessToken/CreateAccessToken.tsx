import { PropsWithChildren, useState } from 'react';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { TextInput } from '@/portainer/components/form-components/Input';
import { Button } from '@/portainer/components/Button';
import { Heading } from '@/portainer/components/form-components/Heading';
import { TextTip } from '@/portainer/components/Tip/TextTip';
import { Code } from '@/edge/components/Code';
import { CopyButton } from '@/portainer/components/Button/CopyButton';

import styles from './CreateAccessToken.module.css';

export interface Props {
  // userId for whom the access token is generated for
  userId: number;

  // onSubmit dispatches a successful matomo analytics event
  onSubmit: () => void;

  // onSuccess is called when upon clicking the done button
  onSuccess: () => void;

  // onError is called when an error occurs; this is a callback to Notifications.error
  onError: (heading: string, err: unknown, message: string) => void;
}

export function CreateAccessToken({
  userId,
  onSubmit,
  onSuccess,
  onError,
}: PropsWithChildren<Props>) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  // TODO: use axios or API service
  async function generateAccessToken() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage
            .getItem('portainer.JWT')
            ?.replace(/['"]+/g, '')}`,
        },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        const json = await res.json();
        setAccessToken(json.rawAPIKey);

        // dispatch matamo analytics event
        onSubmit();
      } else {
        onError('Error', res.statusText, res.statusText);
      }
    } catch (err) {
      onError('Failure', err, 'Failed to generate access token');
    } finally {
      setIsLoading(false);
    }
  }

  function getError() {
    if (description.length === 0) {
      return 'this field is required';
    }
    if (description.replaceAll(' ', '') !== description) {
      return 'this field cannot contain spaces';
    }
    return '';
  }

  return (
    <>
      <div>
        <FormControl inputId="input" label="Description" errors={getError()}>
          <TextInput
            id="input"
            onChange={(value) => setDescription(value)}
            type="text"
            value={description}
          />
        </FormControl>
        <Button
          disabled={!!getError()}
          onClick={generateAccessToken}
          className={styles.addButton}
        >
          Add access token
        </Button>
      </div>
      {accessToken && (
        <>
          <div className="col-sm-12 form-section-title">
            <Heading>New access token</Heading>
            <TextTip>
              Please copy the new access token. You won&#39;t be able to view
              the token again.
            </TextTip>
            <Code>{accessToken}</Code>
            <CopyButton copyText={accessToken} className={styles.copyButton}>
              Copy access token
            </CopyButton>
          </div>

          <Button type="button" onClick={onSuccess}>
            Done
          </Button>
        </>
      )}
    </>
  );
}
