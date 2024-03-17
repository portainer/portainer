import { StackId } from '@/react/common/stacks/types';
import { useGitRefs } from '@/react/portainer/gitops/queries/useGitRefs';

import { PortainerSelect } from '@@/form-components/PortainerSelect';

import { getAuthentication } from '../utils';

import { RefFieldModel } from './types';

export function RefSelector({
  model,
  value,
  onChange,
  isUrlValid,
  stackId,
  createdFromCustomTemplateId,
  inputId,
}: {
  model: RefFieldModel;
  value: string;
  stackId?: StackId;
  createdFromCustomTemplateId?: number;
  onChange: (value: string) => void;
  isUrlValid?: boolean;
  inputId: string;
}) {
  const creds = getAuthentication(model);
  const payload = {
    repository: model.RepositoryURL,
    stackId,
    createdFromCustomTemplateId,
    tlsSkipVerify: model.TLSSkipVerify,
    ...creds,
  };

  const { data: refs } = useGitRefs<Array<{ label: string; value: string }>>(
    payload,
    {
      enabled: !!(model.RepositoryURL && isUrlValid),
      select: (refs) => {
        if (refs.length === 0) {
          return [{ value: 'refs/heads/main', label: 'refs/heads/main' }];
        }

        // put refs/heads/main first if it is present in repository
        if (refs.includes('refs/heads/main')) {
          refs.splice(refs.indexOf('refs/heads/main'), 1);
          refs.unshift('refs/heads/main');
        }

        if (refs.includes('refs/heads/master')) {
          refs.splice(refs.indexOf('refs/heads/master'), 1);
          refs.unshift('refs/heads/master');
        }

        return refs.map((t: string) => ({
          value: t,
          label: t,
        }));
      },

      onSuccess(refs) {
        if (refs && !refs.some((ref) => ref.value === value)) {
          onChange(refs[0].value);
        }
      },
    }
  );

  return (
    <PortainerSelect
      inputId={inputId}
      value={value}
      options={refs || [{ value: 'refs/heads/main', label: 'refs/heads/main' }]}
      onChange={(e) => e && onChange(e)}
      data-cy="component-gitRefInput"
    />
  );
}
