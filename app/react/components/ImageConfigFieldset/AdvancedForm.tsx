import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { TextTip } from '@@/Tip/TextTip';

import { Values } from './types';

export function AdvancedForm({
  values,
  onChange,
}: {
  values: Values;
  onChange: (values: Values) => void;
}) {
  return (
    <>
      <TextTip color="blue">
        When using advanced mode, image and repository <b>must be</b> publicly
        available.
      </TextTip>
      <FormControl
        label="Image"
        inputId="image-field"
        ng-class="$ctrl.labelClass"
      >
        <Input
          id="image-field"
          value={values.image}
          onChange={(e) => handleChange({ image: e.target.value })}
          placeholder="e.g. registry:port/my-image:my-tag"
          required
        />
      </FormControl>
    </>
  );

  function handleChange(newValues: Partial<Values>) {
    onChange({ ...values, ...newValues });
  }
}
