import { Loader2, Plus } from 'lucide-react';
import { FormikErrors } from 'formik';
import { useMemo } from 'react';

import {
  useIngressControllers,
  useIngresses,
} from '@/react/kubernetes/ingresses/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { FormError } from '@@/form-components/FormError';
import { Button } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

import { ServicePortIngressPath } from '../types';

import { AppIngressPathForm } from './AppIngressPathForm';

type Props = {
  servicePortIngressPaths?: ServicePortIngressPath[];
  onChangeIngressPaths: (ingressPath: ServicePortIngressPath[]) => void;
  namespace?: string;
  ingressPathsErrors?: FormikErrors<ServicePortIngressPath[]>;
  serviceIndex: number;
  portIndex: number;
  isEditMode?: boolean;
};

export function AppIngressPathsForm({
  servicePortIngressPaths,
  onChangeIngressPaths,
  namespace,
  ingressPathsErrors,
  serviceIndex,
  portIndex,
  isEditMode,
}: Props) {
  const environmentId = useEnvironmentId();
  const ingressesQuery = useIngresses(environmentId);
  const { data: ingresses } = ingressesQuery;
  const { data: ingressControllers, ...ingressControllersQuery } =
    useIngressControllers(environmentId, namespace);

  // filter for the ingresses that use allowed ingress controllers
  const allowedIngressHostNameOptions = useMemo(() => {
    const allowedIngressClasses =
      ingressControllers
        ?.filter((ic) => ic.Availability)
        .map((ic) => ic.ClassName) || [];
    const allowedIngresses =
      ingresses?.filter((ing) => {
        const className = ing.ClassName || 'none';
        return (
          allowedIngressClasses.includes(className) &&
          ing.Namespace === namespace
        );
      }) || [];
    return allowedIngresses.flatMap((ing) =>
      ing.Hosts?.length
        ? ing.Hosts.map((host) => ({
            label: `${host} (${ing.Name})`,
            value: host,
            ingressName: ing.Name,
          }))
        : []
    );
  }, [namespace, ingressControllers, ingresses]);

  if (ingressesQuery.isError || ingressControllersQuery.isError) {
    return <FormError>Unable to load ingresses.</FormError>;
  }

  if (ingressesQuery.isLoading || ingressControllersQuery.isLoading) {
    return (
      <p className="text-muted mt-2 flex items-center gap-x-2 text-sm">
        <Icon icon={Loader2} className="animate-spin-slow" />
        Loading ingresses...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="!mb-0 flex w-full flex-wrap items-center gap-x-4 gap-y-2">
        <SwitchField
          fieldClass="w-max gap-x-8"
          label="Expose via ingress"
          tooltip="Expose this ClusterIP service externally using an ingress. This will create a new ingress path for the selected ingress hostname."
          labelClass="w-max"
          name="publish-ingress"
          checked={!!servicePortIngressPaths?.length}
          onChange={(value) => {
            const newIngressPathsValue = value
              ? [
                  {
                    Host: allowedIngressHostNameOptions[0]?.value ?? '',
                    IngressName:
                      allowedIngressHostNameOptions[0]?.ingressName ?? '',
                    Path: '',
                  },
                ]
              : [];
            onChangeIngressPaths(newIngressPathsValue);
          }}
          data-cy={`applicationCreate-publishIngress-${serviceIndex}-${portIndex}`}
        />
        {!!servicePortIngressPaths?.length && (
          <TextTip color="blue">
            Select from available ingresses below, or add new or edit existing
            ones via the{' '}
            <Link
              to="kubernetes.ingresses"
              target="_blank"
              rel="noopener noreferrer"
              data-cy="applicationCreate-ingressesLink"
            >
              Ingresses screen
            </Link>{' '}
            and then reload the hostname dropdown.
          </TextTip>
        )}
      </div>
      {ingressesQuery.isSuccess && ingressControllersQuery.isSuccess
        ? servicePortIngressPaths?.map((ingressPath, index) => (
            <AppIngressPathForm
              key={index}
              ingressPath={ingressPath}
              ingressPathErrors={ingressPathsErrors?.[index]}
              ingressHostOptions={allowedIngressHostNameOptions}
              onChangeIngressPath={(ingressPath: ServicePortIngressPath) => {
                const newIngressPaths = structuredClone(
                  servicePortIngressPaths
                );
                newIngressPaths[index] = ingressPath;
                onChangeIngressPaths(newIngressPaths);
              }}
              onRemoveIngressPath={() => {
                const newIngressPaths = structuredClone(
                  servicePortIngressPaths
                );
                newIngressPaths.splice(index, 1);
                onChangeIngressPaths(newIngressPaths);
              }}
              ingressesQuery={ingressesQuery}
              namespace={namespace}
              isEditMode={isEditMode}
            />
          ))
        : null}
      {!!servicePortIngressPaths?.length && (
        <div className="flex w-full flex-wrap gap-2">
          <Button
            icon={Plus}
            data-cy={`applicationCreate-addIngressPath-${serviceIndex}-${portIndex}`}
            className="!ml-0"
            size="small"
            color="default"
            onClick={() => {
              const newIngressPaths = structuredClone(servicePortIngressPaths);
              newIngressPaths.push({
                Host: allowedIngressHostNameOptions[0]?.value,
                IngressName: allowedIngressHostNameOptions[0]?.ingressName,
                Path: '',
              });
              onChangeIngressPaths(newIngressPaths);
            }}
          >
            Add path
          </Button>
        </div>
      )}
    </div>
  );
}
