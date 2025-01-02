import { useParamsState } from '@/react/hooks/useParamState';

export function useTemplateParams() {
  const [{ id, type }, setTemplateParams] = useParamsState(
    ['templateId', 'templateType'],
    (params) => ({
      id: parseTemplateId(params.templateId),
      type: parseTemplateType(params.templateType),
    })
  );

  return [{ id, type }, setTemplateParams] as const;
}

function parseTemplateId(param?: string) {
  if (!param) {
    return undefined;
  }

  return parseInt(param, 10);
}

function parseTemplateType(param?: string): 'app' | 'custom' | undefined {
  if (param === 'app' || param === 'custom') {
    return param;
  }

  return undefined;
}
