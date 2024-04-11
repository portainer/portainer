import { InputList } from '@@/form-components/InputList';
import { ArrayError } from '@@/form-components/InputList/InputList';

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
  errors?: ArrayError<Values>;
}) {
  return (
    <InputContext.Provider value={allowBindMounts}>
      <InputList<Volume>
        errors={Array.isArray(errors) ? errors : []}
        label="Volume mapping"
        onChange={(volumes) => handleChange(volumes)}
        value={values}
        addLabel="map additional volume"
        item={Item}
        itemBuilder={() => ({
          containerPath: '',
          type: 'volume',
          name: '',
          readOnly: false,
        })}
        data-cy="docker-container-volumes"
      />
    </InputContext.Provider>
  );

  function handleChange(newValues: Values) {
    onChange(newValues);
  }
}
