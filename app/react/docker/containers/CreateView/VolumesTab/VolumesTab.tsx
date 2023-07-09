import { useState } from 'react';
import { FormikErrors } from 'formik';

import { InputList } from '@@/form-components/InputList';

import { Values, Volume } from './types';
import { InputContext } from './context';
import { Item } from './Item';

export function VolumesTab({
  onChange,
  values,
  allowBindMounts,
  errors,
}: {
  onChange: (values: Values) => void;
  values: Values;
  allowBindMounts: boolean;
  errors?: FormikErrors<Values>;
}) {
  const [controlledValues, setControlledValues] = useState(values);

  return (
    <InputContext.Provider value={allowBindMounts}>
      <InputList<Volume>
        errors={Array.isArray(errors) ? errors : []}
        label="Volume mapping"
        onChange={(volumes) => handleChange(volumes)}
        value={controlledValues}
        addLabel="map additional volume"
        item={Item}
        itemBuilder={() => ({
          containerPath: '',
          type: 'volume',
          name: '',
          readOnly: false,
        })}
      />
    </InputContext.Provider>
  );

  function handleChange(newValues: Values) {
    onChange(newValues);
    setControlledValues(() => newValues);
  }
}
