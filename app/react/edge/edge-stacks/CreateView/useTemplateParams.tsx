import { useParamsState } from '@/react/hooks/useParamState';

export function useTemplateParams() {
  const [{ templateId, templateType }, setTemplateParams] = useParamsState(
    (params) => ({
      templateId: parseTemplateId(params.templateId),
      templateType: parseTemplateType(params.templateType),
    })
  );

  return [{ templateId, templateType }, setTemplateParams] as const;
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
