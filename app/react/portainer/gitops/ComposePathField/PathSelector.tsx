import { useSearch } from '@/react/portainer/gitops/queries/useSearch';

import { AutocompleteSelect } from '@@/form-components/AutocompleteSelect';

import { GitFormModel } from '../types';

export type PathSelectorGitModel = Pick<
  GitFormModel,
  'RepositoryReferenceName' | 'SourceId'
>;

export function PathSelector({
  value,
  onChange,
  placeholder,
  model,
  dirOnly,
  readOnly,
  inputId,
}: {
  value: string;
  onChange(value: string): void;
  placeholder: string;
  model: PathSelectorGitModel;
  dirOnly?: boolean;
  readOnly?: boolean;
  inputId: string;
}) {
  const payload = {
    keyword: value,
    reference: model.RepositoryReferenceName,
    dirOnly,
    sourceId: model.SourceId,
  };

  const enabled = !!(model.SourceId && value);
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
