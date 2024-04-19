import { ChangeEvent, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { string, StringSchema } from 'yup';

import {
  checkRepo,
  useCheckRepo,
} from '@/react/portainer/gitops/queries/useCheckRepo';
import { useDebounce } from '@/react/hooks/useDebounce';
import { isPortainerError } from '@/portainer/error';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';
import { Button } from '@@/buttons';
import { useCachedValidation } from '@@/form-components/useCachedTest';

import { isBE } from '../feature-flags/feature-flags.service';

import { GitFormModel } from './types';
import { getAuthentication } from './utils';

interface Props {
  value: string;
  onChange(value: string): void;
  onChangeRepositoryValid(value: boolean): void;
  model: GitFormModel;
  createdFromCustomTemplateId?: number;
  errors?: string;
}

export function GitFormUrlField({
  value,
  onChange,
  onChangeRepositoryValid,
  model,
  createdFromCustomTemplateId,
  errors,
}: Props) {
  const queryClient = useQueryClient();

  const creds = getAuthentication(model);
  const [force, setForce] = useState(false);
  const repoStatusQuery = useCheckRepo(
    value,
    {
      creds,
      force,
      tlsSkipVerify: model.TLSSkipVerify,
      createdFromCustomTemplateId,
    },
    {
      onSettled(isValid) {
        onChangeRepositoryValid(!!isValid);
        setForce(false);
      },
      // disabled check on CE since it's not supported
      enabled: isBE,
    }
  );

  const [debouncedValue, debouncedOnChange] = useDebounce(value, onChange);

  const errorMessage = isPortainerError(repoStatusQuery.error)
    ? repoStatusQuery.error.message
    : undefined;

  return (
    <div className="form-group">
      <span className="col-sm-12">
        <TextTip color="blue">You can use the URL of a git repository.</TextTip>
      </span>
      <div className="col-sm-12">
        <FormControl
          label="Repository URL"
          inputId="stack_repository_url"
          errors={errorMessage || errors}
          required
        >
          <span className="flex">
            <Input
              value={debouncedValue}
              type="text"
              name="repoUrlField"
              className="form-control"
              placeholder="https://github.com/portainer/portainer-compose"
              data-cy="component-gitUrlInput"
              required
              onChange={handleChange}
            />

            <Button
              onClick={onRefresh}
              data-cy="component-gitUrlRefreshButton"
              size="medium"
              className="vertical-center"
              color="light"
              icon={RefreshCcw}
              title="refreshGitRepo"
              disabled={!model.RepositoryURLValid}
            />
          </span>
        </FormControl>
      </div>
    </div>
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    debouncedOnChange(e.target.value);
  }

  function onRefresh() {
    setForce(true);
    queryClient.invalidateQueries(['git_repo_refs', 'git_repo_search_results']);
  }
}

// Todo: once git form is used only in react, it should be used for validation instead of L40-52
export function useUrlValidation(force: boolean) {
  const existenceTest = useCachedValidation<string, GitFormModel>(
    (url, context) => {
      if (!url) {
        return Promise.resolve(true);
      }

      const model = context.parent as GitFormModel;

      const creds = getAuthentication(model);
      return checkRepo(url, { creds, force });
    }
  );

  return (string() as StringSchema<string, GitFormModel>)
    .url('Invalid Url')
    .required('Repository URL is required')
    .test('repo-exists', 'Repository does not exist', existenceTest);
}
