import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Switch } from '@@/form-components/SwitchField/Switch';

const fieldKey = 'OpenAIIntegration';

export function EnableOpenAIIntegrationSwitch() {
  const [inputProps, meta, helpers] = useField<boolean>(fieldKey);

  return (
    <FormControl
      inputId="experimental_openAI"
      label="Enable OpenAI integration"
      size="medium"
      errors={meta.error}
    >
      <Switch
        id="experimental_openAI"
        data-cy="enable-openai-integration-switch"
        name={fieldKey}
        className="space-right"
        checked={inputProps.value}
        onChange={handleChange}
      />
    </FormControl>
  );

  function handleChange(enable: boolean) {
    helpers.setValue(enable);
  }
}
