import { useField } from 'formik';
import { useState } from 'react';

export function useToggledValue(fieldName: string) {
  const [, { value }, { setValue }] = useField<string>(fieldName);
  const [, { value: isEnabled }, { setValue: setIsEnabled }] =
    useField<boolean>(`${fieldName}Enabled`);
  const [oldValue, setOldValue] = useState(value);

  function handleIsEnabledChange(enabled: boolean) {
    setIsEnabled(enabled);
    if (enabled) {
      setOldValue('');
      setValue(oldValue);
    } else {
      setOldValue(value);
      setValue('');
    }
  }

  return [isEnabled, handleIsEnabledChange] as const;
}
