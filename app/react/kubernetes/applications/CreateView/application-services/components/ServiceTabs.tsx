import clsx from 'clsx';

import { ServiceTypeOption, ServiceType } from '../types';

type Props = {
  serviceTypeOptions: ServiceTypeOption[];
  selectedServiceType: ServiceType;
  setSelectedServiceType: (serviceTypeValue: ServiceType) => void;
};

export function ServiceTabs({
  serviceTypeOptions,
  selectedServiceType,
  setSelectedServiceType,
}: Props) {
  return (
    <div className="flex pl-2">
      {serviceTypeOptions.map(({ label }, index) => (
        <label
          key={index}
          className={clsx(
            '!mb-0 inline-flex cursor-pointer items-center gap-2 border-0 border-b-2 border-solid bg-transparent px-4 py-2 font-medium',
            selectedServiceType === serviceTypeOptions[index].value
              ? 'border-blue-8  text-blue-8 th-highcontrast:border-blue-6 th-highcontrast:text-blue-6 th-dark:border-blue-6 th-dark:text-blue-6'
              : 'border-transparent'
          )}
        >
          <input
            type="radio"
            data-cy="service-type-radio"
            name="widget-tabs"
            className="hidden"
            value={serviceTypeOptions[index].value}
            checked={selectedServiceType === serviceTypeOptions[index].value}
            onChange={(e) =>
              setSelectedServiceType(e.target.value as ServiceType)
            }
          />
          {label}
        </label>
      ))}
    </div>
  );
}
