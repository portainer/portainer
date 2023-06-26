import { RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { UseQueryResult } from 'react-query';
import { FormikErrors } from 'formik';

import { Ingress } from '@/react/kubernetes/ingresses/types';

import { Select } from '@@/form-components/ReactSelect';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { Link } from '@@/Link';

import { IngressOption, ServicePortIngressPath } from '../types';

type Props = {
  ingressPath?: ServicePortIngressPath;
  ingressPathErrors?: FormikErrors<ServicePortIngressPath>;
  ingressHostOptions: IngressOption[];
  onChangeIngressPath: (ingressPath: ServicePortIngressPath) => void;
  onRemoveIngressPath: () => void;
  ingressesQuery: UseQueryResult<Ingress[], unknown>;
  namespace?: string;
  isEditMode?: boolean;
};

export function AppIngressPathForm({
  ingressPath,
  ingressPathErrors,
  ingressHostOptions,
  onChangeIngressPath,
  onRemoveIngressPath,
  ingressesQuery,
  namespace,
  isEditMode,
}: Props) {
  const [selectedIngress, setSelectedIngress] = useState<IngressOption | null>(
    ingressHostOptions[0] ?? null
  );

  // if editing allow the current value as an option,
  // to handle the case where they disallow the ingress class after creating the path
  const ingressHostOptionsWithCurrentValue = useMemo(() => {
    if (
      ingressHostOptions.length === 0 &&
      ingressPath?.Host &&
      ingressPath?.IngressName &&
      isEditMode
    ) {
      return [
        {
          value: ingressPath.Host,
          label: ingressPath.Host,
          ingressName: ingressPath.IngressName,
        },
      ];
    }
    return ingressHostOptions;
  }, [
    ingressHostOptions,
    ingressPath?.Host,
    ingressPath?.IngressName,
    isEditMode,
  ]);

  // when the hostname options change (e.g. after a namespace change), update the selected ingress to the first available one
  useEffect(() => {
    if (ingressHostOptionsWithCurrentValue) {
      const newIngressPath = {
        ...ingressPath,
        Host: ingressHostOptionsWithCurrentValue[0]?.value,
        IngressName: ingressHostOptionsWithCurrentValue[0]?.ingressName,
      };
      onChangeIngressPath(newIngressPath);
      setSelectedIngress(ingressHostOptionsWithCurrentValue[0] ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingressHostOptionsWithCurrentValue]);

  return (
    <div className="flex w-full flex-wrap gap-x-4">
      <div className="flex min-w-[250px] basis-1/3 flex-col">
        <InputGroup size="small">
          <InputGroup.Addon>Hostname</InputGroup.Addon>
          <Select
            options={ingressHostOptions}
            value={selectedIngress}
            defaultValue={ingressHostOptions[0]}
            placeholder="Select a hostname..."
            theme={(theme) => ({
              ...theme,
              borderRadius: 0,
            })}
            size="sm"
            onChange={(ingressOption) => {
              setSelectedIngress(ingressOption);
              const newIngressPath = {
                ...ingressPath,
                Host: ingressOption?.value,
                IngressName: ingressOption?.ingressName,
              };
              onChangeIngressPath(newIngressPath);
            }}
          />
          <InputGroup.ButtonWrapper>
            <Button
              icon={RefreshCw}
              color="default"
              onClick={() => ingressesQuery.refetch()}
            />
          </InputGroup.ButtonWrapper>
        </InputGroup>
        {ingressHostOptions.length === 0 && !ingressPath?.Host && (
          <FormError>
            No ingress hostnames are available for the namespace &apos;
            {namespace}&apos;. Please update the namespace or{' '}
            <Link
              to="kubernetes.ingresses.create"
              target="_blank"
              rel="noopener noreferrer"
            >
              create an ingress
            </Link>
            .
          </FormError>
        )}
        {ingressPathErrors?.Host && ingressHostOptions.length > 0 && (
          <FormError>{ingressPathErrors?.Host}</FormError>
        )}
      </div>
      <div className="flex min-w-[250px] basis-1/3 flex-col">
        <InputGroup size="small">
          <InputGroup.Addon required>Path</InputGroup.Addon>
          <InputGroup.Input
            value={ingressPath?.Path ?? ''}
            placeholder="/example"
            onChange={(e) => {
              const newIngressPath = {
                ...ingressPath,
                Path: e.target.value,
              };
              onChangeIngressPath(newIngressPath);
            }}
          />
        </InputGroup>
        {ingressPathErrors?.Path && (
          <FormError>{ingressPathErrors?.Path}</FormError>
        )}
      </div>
      <div className="flex flex-col">
        <Button
          icon={Trash2}
          color="dangerlight"
          size="medium"
          className="!ml-0"
          onClick={() => onRemoveIngressPath()}
        />
      </div>
    </div>
  );
}
