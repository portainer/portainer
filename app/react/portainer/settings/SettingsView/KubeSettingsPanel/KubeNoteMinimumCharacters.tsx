import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { SwitchField } from '@@/form-components/SwitchField';
import { Input } from '@@/form-components/Input';

import { useToggledValue } from '../useToggledValue';

export function KubeNoteMinimumCharacters() {
  const [{ value }, { error }, { setValue }] = useField<number>(
    'minApplicationNoteLength'
  );
  const [isEnabled, setIsEnabled] = useToggledValue(
    'globalDeploymentOptions.minApplicationNoteLength',
    'globalDeploymentOptions.requireNoteOnApplications'
  );

  return (
    <>
      <div className="form-group">
        <SwitchField
          label="Require a note on applications"
          checked={isEnabled}
          name="toggle_requireNoteOnApplications"
          onChange={(value) => setIsEnabled(value)}
          fieldClass="col-sm-12"
          labelClass="col-sm-2"
          tooltip="Using this will enforce entry of a note in Add/Edit application (and prevent complete clearing of it in Application details)."
        />
      </div>
      {isEnabled && (
        <FormControl
          label={
            <span className="pl-4">
              Minimum number of characters note must have
            </span>
          }
          errors={error}
        >
          <Input
            name="minNoteLength"
            type="number"
            placeholder="50"
            min="1"
            max="9999"
            value={value}
            onChange={(e) => setValue(e.target.valueAsNumber)}
            className="w-1/4"
          />
        </FormControl>
      )}
    </>
  );
}
