import { array, object, string } from 'yup';
import { useTranslation } from 'react-i18next';

import { r2a } from '@/react-tools/react2angular';
import { withControlledInput } from '@/react-tools/withControlledInput';

import { InputList } from '@@/form-components/InputList';
import { ItemProps } from '@@/form-components/InputList/InputList';
import { InputGroup } from '@@/form-components/InputGroup';

export interface Gpu {
  value: string;
  name: string;
}

interface Props {
  value: Gpu[];
  onChange(value: Gpu[]): void;
}

function Item({ item, onChange, index }: ItemProps<Gpu>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-grow gap-2">
      <InputGroup size="small" className="flex-grow">
        <InputGroup.Addon>{t('docker.gpus.gpu_name')}</InputGroup.Addon>
        <InputGroup.Input
          placeholder={t('docker.gpus.gpu_name_placeholder')}
          value={item.name}
          onChange={(e) => {
            onChange({ ...item, name: e.target.value });
          }}
          data-cy={`docker-gpu-name_${index}`}
        />
      </InputGroup>

      <InputGroup size="small" className="flex-grow">
        <InputGroup.Addon>{t('docker.gpus.index_or_uuid')}</InputGroup.Addon>
        <InputGroup.Input
          placeholder={t('docker.gpus.index_or_uuid_placeholder')}
          value={item.value}
          onChange={(e) => {
            onChange({ ...item, value: e.target.value });
          }}
          data-cy={`docker-gpu-value_${index}`}
        />
      </InputGroup>
    </div>
  );
}

export function GpusList({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <InputList<Gpu>
      label={t('docker.gpus.label')}
      tooltip={t('docker.gpus.tooltip')}
      value={value}
      onChange={onChange}
      itemBuilder={() => ({ value: '', name: '' })}
      addLabel={t('docker.gpus.add_gpu')}
      item={Item}
      data-cy="docker-containers-gpus"
    />
  );
}

export function gpusListValidation() {
  const gpuShape = object().shape({
    name: string().required(),
    value: string().required(),
  });
  return array().of(gpuShape).default([]);
}

export const GpusListAngular = r2a(withControlledInput(GpusList), [
  'value',
  'onChange',
]);
