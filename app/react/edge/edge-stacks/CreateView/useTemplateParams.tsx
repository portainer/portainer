import { useRouter } from '@uirouter/react';

import { useParamState } from '@/react/hooks/useParamState';

export function useTemplateParams() {
  const router = useRouter();
  const [id] = useParamState('templateId', (param) => {
    if (!param) {
      return undefined;
    }

    const templateId = parseInt(param, 10);
    if (Number.isNaN(templateId)) {
      return undefined;
    }

    return templateId;
  });

  const [type] = useParamState('templateType', (param) => {
    if (param === 'app' || param === 'custom') {
      return param;
    }

    return undefined;
  });

  return [{ id, type }, handleChange] as const;

  function handleChange({
    id,
    type,
  }: {
    id: number | undefined;
    type: 'app' | 'custom' | undefined;
  }) {
    router.stateService.go(
      '.',
      { templateId: id, templateType: type },
      { reload: false }
    );
  }
}
