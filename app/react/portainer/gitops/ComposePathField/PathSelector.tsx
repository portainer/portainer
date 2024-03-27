import { useSearch } from '@/react/portainer/gitops/queries/useSearch';

import { AutocompleteSelect } from '@@/form-components/AutocompleteSelect';

import { getAuthentication } from '../utils';
import { GitFormModel } from '../types';

export function PathSelector({
  value,
  onChange,
  placeholder,
  model,
  dirOnly,
  readOnly,
  inputId,
  createdFromCustomTemplateId,
}: {
  value: string;
  onChange(value: string): void;
  placeholder: string;
  model: GitFormModel;
  dirOnly?: boolean;
  readOnly?: boolean;
  inputId: string;
  createdFromCustomTemplateId?: number;
}) {
  const creds = getAuthentication(model);
  const payload = {
    repository: model.RepositoryURL,
    keyword: value,
    reference: model.RepositoryReferenceName,
    tlsSkipVerify: model.TLSSkipVerify,
    dirOnly,
    createdFromCustomTemplateId,
    ...creds,
  };
  const enabled = Boolean(
    model.RepositoryURL && model.RepositoryURLValid && value
  );
  const { data: searchResults } = useSearch(payload, enabled);

  return (
    <AutocompleteSelect
      searchResults={searchResults?.map((result) => ({
        value: result,
        label: result,
      }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      inputId={inputId}
      data-cy="git-ops-path-selector"
    />
  );
}
