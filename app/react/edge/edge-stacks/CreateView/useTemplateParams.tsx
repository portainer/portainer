import { useParamState } from '@/react/hooks/useParamState';

export function useTemplateParams() {
  const [id, setTemplateId] = useParamState('templateId', (param) => {
    if (!param) {
      return undefined;
    }

    const templateId = parseInt(param, 10);
    if (Number.isNaN(templateId)) {
      return undefined;
    }

    return templateId;
  });

  const [type, setTemplateType] = useParamState('templateType', (param) => {
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
    setTemplateId(id);
    setTemplateType(type);
  }
}
