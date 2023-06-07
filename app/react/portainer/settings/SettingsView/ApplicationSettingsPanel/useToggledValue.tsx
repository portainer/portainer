import { useField } from 'formik';
import { useState } from 'react';

export function useToggledValue(fieldName: string) {
  const [, { value }, { setValue }] = useField<string>(fieldName);
  const [, { value: isEnabled }, { setValue: setIsEnabled }] =
    useField<boolean>(`${fieldName}Enabled`);
  const [oldValue, setOldValue] = useState(value);

  async function handleIsEnabledChange(enabled: boolean) {
    setOldValue(enabled ? '' : value);
    // `setValue` is async, formik types are wrong for this version
    await setIsEnabled(enabled);
    await setValue(enabled ? oldValue : '', true);
  }

  return [isEnabled, handleIsEnabledChange] as const;
}
