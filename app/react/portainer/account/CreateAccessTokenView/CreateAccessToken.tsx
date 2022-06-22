import { PropsWithChildren, useEffect, useState } from 'react';
import { useRouter } from '@uirouter/react';
import { Trans, useTranslation } from 'react-i18next';

import { Widget, WidgetBody } from '@@/Widget';
import { FormControl } from '@@/form-components/FormControl';
import { Button } from '@@/buttons';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { TextTip } from '@@/Tip/TextTip';
import { Code } from '@@/Code';
import { CopyButton } from '@@/buttons/CopyButton';
import { Input } from '@@/form-components/Input';

interface AccessTokenResponse {
  rawAPIKey: string;
}

export interface Props {
  // onSubmit dispatches a successful matomo analytics event
  onSubmit: (description: string) => Promise<AccessTokenResponse>;

  // onError is called when an error occurs; this is a callback to Notifications.error
  onError: (heading: string, err: unknown, message: string) => void;
}

export function CreateAccessToken({
  onSubmit,
  onError,
}: PropsWithChildren<Props>) {
  const translationNS = 'account.accessTokens.create';
  const { t } = useTranslation(translationNS);

  const router = useRouter();
  const [description, setDescription] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (description.length === 0) {
      setErrorText(t('this field is required'));
    } else setErrorText('');
  }, [description, t]);

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
        <div className="form-horizontal">
          <FormControl
            inputId="input"
            label={t('Description')}
            errors={errorText}
          >
            <Input
              id="input"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </FormControl>
          <div className="row mt-5">
            <div className="col-sm-12">
              <Button
                disabled={!!errorText || !!accessToken}
                onClick={() => generateAccessToken()}
              >
                {t('Add access token')}
              </Button>
            </div>
          </div>
        </div>
        {accessToken && (
          <>
            <FormSectionTitle>
              <Trans ns={translationNS}>New access token</Trans>
            </FormSectionTitle>
            <TextTip>
              <Trans ns={translationNS}>
                Please copy the new access token. You won&#39;t be able to view
                the token again.
              </Trans>
            </TextTip>
            <Code>{accessToken}</Code>
            <CopyButton copyText={accessToken}>
              <Trans ns={translationNS}>Copy access token</Trans>
            </CopyButton>
            <hr />
            <Button
              type="button"
              onClick={() => router.stateService.go('portainer.account')}
            >
              <Trans ns={translationNS}>Done</Trans>
            </Button>
          </>
        )}
      </WidgetBody>
    </Widget>
  );
}
