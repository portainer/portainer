import { FormikErrors } from 'formik';
import { boolean, number, object, SchemaOf, string } from 'yup';
import { useState } from 'react';

import { GitAuthModel } from '@/react/portainer/gitops/types';
import { useDebounce } from '@/react/hooks/useDebounce';
import { GitCredential } from '@/react/portainer/account/git-credentials/types';

import { SwitchField } from '@@/form-components/SwitchField';
import { Input } from '@@/form-components/Input';
import { FormControl } from '@@/form-components/FormControl';
import { TextTip } from '@@/Tip/TextTip';

import { isBE } from '../../feature-flags/feature-flags.service';

import { CredentialSelector } from './CredentialSelector';
import { NewCredentialForm } from './NewCredentialForm';

interface Props {
  value: GitAuthModel;
  onChange: (value: Partial<GitAuthModel>) => void;
  isAuthExplanationVisible?: boolean;
  errors?: FormikErrors<GitAuthModel>;
}

export function AuthFieldset({
  value: initialValue,
  onChange,
  isAuthExplanationVisible,
  errors,
}: Props) {
  const [value, setValue] = useState(initialValue); // TODO: remove this state when form is not inside angularjs
  const [username, setUsername] = useDebounce(
    value.RepositoryUsername || '',
    (username) => handleChange({ RepositoryUsername: username })
  );
  const [password, setPassword] = useDebounce(
    value.RepositoryPassword || '',
    (password) => handleChange({ RepositoryPassword: password })
  );

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Authentication"
            labelClass="col-sm-3 col-lg-2"
            name="authentication"
            checked={value.RepositoryAuthentication || false}
            onChange={(value) =>
              handleChange({ RepositoryAuthentication: value })
            }
            data-cy="component-gitAuthToggle"
          />
        </div>
      </div>

      {value.RepositoryAuthentication && (
        <>
          {isAuthExplanationVisible && (
            <TextTip color="orange" className="mb-2">
              Enabling authentication will store the credentials and it is
              advisable to use a git service account
            </TextTip>
          )}

          {isBE && (
            <CredentialSelector
              onChange={handleChangeGitCredential}
              value={value.RepositoryGitCredentialID}
            />
          )}

          <div className="form-group">
            <div className="col-sm-12">
              <FormControl label="Username" errors={errors?.RepositoryUsername}>
                <Input
                  value={username}
                  name="repository_username"
                  placeholder={
                    value.RepositoryGitCredentialID ? '' : 'git username'
                  }
                  onChange={(e) => setUsername(e.target.value)}
                  data-cy="component-gitUsernameInput"
                  readOnly={!!value.RepositoryGitCredentialID}
                />
              </FormControl>
            </div>
          </div>
          <div className="form-group !mb-0">
            <div className="col-sm-12">
              <FormControl
                label="Personal Access Token"
                tooltip="Provide a personal access token or password"
                errors={errors?.RepositoryPassword}
              >
                <Input
                  type="password"
                  value={password}
                  name="repository_password"
                  placeholder="*******"
                  onChange={(e) => setPassword(e.target.value)}
                  data-cy="component-gitPasswordInput"
                  readOnly={!!value.RepositoryGitCredentialID}
                />
              </FormControl>
            </div>
          </div>
          {!value.RepositoryGitCredentialID &&
            value.RepositoryPassword &&
            isBE && (
              <NewCredentialForm
                value={value}
                onChange={handleChange}
                errors={errors}
              />
            )}
        </>
      )}
    </>
  );

  function handleChangeGitCredential(gitCredential?: GitCredential | null) {
    handleChange(
      gitCredential
        ? {
            RepositoryGitCredentialID: gitCredential.id,
            RepositoryUsername: gitCredential?.username,
            RepositoryPassword: '',
            SaveCredential: false,
            NewCredentialName: '',
          }
        : {
            RepositoryGitCredentialID: 0,
            RepositoryUsername: '',
            RepositoryPassword: '',
          }
    );
  }

  function handleChange(partialValue: Partial<GitAuthModel>) {
    onChange(partialValue);
    setValue((value) => ({ ...value, ...partialValue }));
  }
}

export function gitAuthValidation(
  gitCredentials: Array<GitCredential>,
  isAuthEdit: boolean,
  isCreatedFromCustomTemplate: boolean
): SchemaOf<GitAuthModel> {
  return object({
    RepositoryAuthentication: boolean().default(false),
    RepositoryGitCredentialID: number().default(0),
    RepositoryUsername: string()
      .when(['RepositoryAuthentication', 'RepositoryGitCredentialID'], {
        is: (auth: boolean, id: number) => auth && !id,
        then: string().required('Username is required'),
      })
      .default(''),
    RepositoryPassword: string()
      .when(['RepositoryAuthentication', 'RepositoryGitCredentialID'], {
        is: (auth: boolean, id: number) =>
          auth && !id && !isAuthEdit && !isCreatedFromCustomTemplate,
        then: string().required('Password is required'),
      })
      .default(''),
    SaveCredential: boolean().default(false),
    NewCredentialName: string()
      .default('')
      .when(['RepositoryAuthentication', 'SaveCredential'], {
        is: (RepositoryAuthentication: boolean, SaveCredential: boolean) =>
          RepositoryAuthentication && SaveCredential && !isAuthEdit,
        then: string()
          .required('Name is required')
          .test(
            'is-unique',
            'This name is already been used, please try another one',
            (name) => !!name && !gitCredentials.find((x) => x.name === name)
          )
          .matches(
            /^[-_a-z0-9]+$/,
            "This field must consist of lower case alphanumeric characters, '_' or '-' (e.g. 'my-name', or 'abc-123')."
          ),
      }),
  });
}
