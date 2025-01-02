import { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { v4 as uuidv4 } from 'uuid';
import { debounce } from 'lodash';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useK8sSecrets } from '@/react/kubernetes/configs/queries/useK8sSecrets';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { useAuthorizations } from '@/react/hooks/useUser';
import { Annotation } from '@/react/kubernetes/annotations/types';
import { prepareAnnotations } from '@/react/kubernetes/utils';

import { Link } from '@@/Link';
import { PageHeader } from '@@/PageHeader';
import { Option } from '@@/form-components/Input/Select';
import { Button } from '@@/buttons';

import { useNamespacesQuery } from '../../namespaces/queries/useNamespacesQuery';
import { Ingress, IngressController } from '../types';
import {
  useCreateIngress,
  useIngresses,
  useUpdateIngress,
  useIngressControllers,
} from '../queries';
import { useNamespaceServices } from '../../services/useNamespaceServices';

import {
  Rule,
  Path,
  Host,
  GroupedServiceOptions,
  IngressErrors,
} from './types';
import { IngressForm } from './IngressForm';
import {
  prepareTLS,
  preparePaths,
  prepareRuleFromIngress,
  checkIfPathExistsWithHost,
} from './utils';

export function CreateIngressView() {
  const environmentId = useEnvironmentId();
  const { params } = useCurrentStateAndParams();
  const { authorized: isAuthorizedToAddEdit } = useAuthorizations([
    'K8sIngressesW',
  ]);

  const router = useRouter();
  const isEdit = !!params.namespace;

  useEffect(() => {
    if (!isAuthorizedToAddEdit) {
      const message = `Not authorized to ${isEdit ? 'edit' : 'add'} ingresses`;
      notifyError('Error', new Error(message));
      router.stateService.go('kubernetes.ingresses');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorizedToAddEdit, isEdit]);

  const [namespace, setNamespace] = useState<string>(params.namespace || '');
  const [ingressRule, setIngressRule] = useState<Rule>({} as Rule);
  // isEditClassNameSet is used to prevent premature validation of the classname in the edit view
  const [isEditClassNameSet, setIsEditClassNameSet] = useState<boolean>(false);

  const [errors, setErrors] = useState<IngressErrors>({});

  const { data: namespaces, ...namespacesQuery } =
    useNamespacesQuery(environmentId);

  const { data: allServices } = useNamespaceServices(environmentId, namespace);
  const secretsResults = useK8sSecrets(environmentId, namespace);
  const ingressesResults = useIngresses(environmentId);
  const { data: ingressControllers, ...ingressControllersQuery } =
    useIngressControllers(environmentId, namespace);

  const createIngressMutation = useCreateIngress();
  const updateIngressMutation = useUpdateIngress();

  const [ingressNames, ingresses, ruleCounterByNamespace, hostWithTLS] =
    useMemo((): [
      string[],
      Ingress[],
      Record<string, number>,
      Record<string, string>,
    ] => {
      const ruleCounterByNamespace: Record<string, number> = {};
      const hostWithTLS: Record<string, string> = {};
      ingressesResults.data?.forEach((ingress: Ingress) => {
        ingress.TLS?.forEach((tls) => {
          tls.Hosts.forEach((host) => {
            hostWithTLS[host] = tls.SecretName;
          });
        });
      });
      const ingressNames: string[] = [];
      ingressesResults.data?.forEach((ing: Ingress) => {
        ruleCounterByNamespace[ing.Namespace] =
          ruleCounterByNamespace[ing.Namespace] || 0;
        const n = ing.Name.match(/^(.*)-(\d+)$/);
        if (n?.length === 3) {
          ruleCounterByNamespace[ing.Namespace] = Math.max(
            ruleCounterByNamespace[ing.Namespace],
            Number(n[2])
          );
        }
        if (ing.Namespace === namespace) {
          ingressNames.push(ing.Name);
        }
      });
      return [
        ingressNames || [],
        ingressesResults.data || [],
        ruleCounterByNamespace,
        hostWithTLS,
      ];
    }, [ingressesResults.data, namespace]);

  const namespaceOptions = useMemo(
    () =>
      Object.entries(namespaces || {})
        .filter(([, ns]) => !ns.IsSystem)
        .map(([, ns]) => ({
          label: ns.Name,
          value: ns.Name,
        })),
    [namespaces]
  );

  const serviceOptions: GroupedServiceOptions = useMemo(() => {
    const groupedOptions: GroupedServiceOptions = (
      allServices?.reduce<GroupedServiceOptions>(
        (groupedOptions, service) => {
          // add a new option to the group that matches the service type
          const newGroupedOptions = groupedOptions.map((group) => {
            if (group.label === service.Type) {
              return {
                ...group,
                options: [
                  ...group.options,
                  {
                    label: service.Name,
                    selectedLabel: `${service.Name} (${service.Type})`,
                    value: service.Name,
                  },
                ],
              };
            }
            return group;
          });
          return newGroupedOptions;
        },
        [
          { label: 'ClusterIP', options: [] },
          { label: 'NodePort', options: [] },
          { label: 'LoadBalancer', options: [] },
        ] as GroupedServiceOptions
      ) || []
    ).filter((group) => group.options.length > 0);
    return groupedOptions;
  }, [allServices]);

  const servicePorts = useMemo(
    () =>
      allServices
        ? Object.fromEntries(
            allServices?.map((service) => [
              service.Name,
              service.Ports?.map((port) => ({
                label: String(port.Port),
                value: String(port.Port),
              })) ?? [],
            ])
          )
        : {},
    [allServices]
  );

  const existingIngressClass = useMemo(
    () =>
      ingressControllers?.find(
        (controller) =>
          controller.ClassName === ingressRule.IngressClassName ||
          (controller.Type === 'custom' && ingressRule.IngressClassName === '')
      ),
    [ingressControllers, ingressRule.IngressClassName]
  );

  const ingressClassOptions: Option<string>[] = useMemo(() => {
    const allowedIngressClassOptions =
      ingressControllers
        ?.filter((controller) => !!controller.Availability)
        .map((cls) => ({
          label: cls.ClassName,
          value: cls.ClassName,
        })) || [];

    // if the ingress class is not set, return only the allowed ingress classes
    if (ingressRule.IngressClassName === '' || !isEdit) {
      return allowedIngressClassOptions;
    }

    // if the ingress class is set and it exists (even if disallowed), return the allowed ingress classes + the disallowed option
    const disallowedIngressClasses =
      ingressControllers
        ?.filter(
          (controller) =>
            !controller.Availability &&
            existingIngressClass?.ClassName === controller.ClassName
        )
        .map((controller) => ({
          label: `${controller.ClassName} - DISALLOWED`,
          value: controller.ClassName,
        })) || [];

    const existingIngressClassFound = ingressControllers?.find(
      (controller) => existingIngressClass?.ClassName === controller.ClassName
    );
    if (existingIngressClassFound) {
      return [...allowedIngressClassOptions, ...disallowedIngressClasses];
    }

    // if the ingress class is set and it doesn't exist, return the allowed ingress classes + the not found option
    const notFoundIngressClassOption = {
      label: `${ingressRule.IngressClassName} - NOT FOUND`,
      value: ingressRule.IngressClassName || '',
    };
    return [...allowedIngressClassOptions, notFoundIngressClassOption];
  }, [
    existingIngressClass?.ClassName,
    ingressControllers,
    ingressRule.IngressClassName,
    isEdit,
  ]);

  const handleIngressChange = useCallback(
    (key: string, val: string) => {
      setIngressRule((prevRules) => {
        const rule = { ...prevRules, [key]: val };
        if (key === 'IngressClassName') {
          rule.IngressType = ingressControllers?.find(
            (c) => c.ClassName === val
          )?.Type;
        }
        return rule;
      });
    },
    [ingressControllers]
  );

  // when them selected ingress class option update is no longer available set to an empty value
  useEffect(() => {
    const ingressClasses = ingressClassOptions.map((option) => option.value);
    if (
      !ingressClasses.includes(ingressRule.IngressClassName) &&
      ingressControllersQuery.isSuccess
    ) {
      handleIngressChange('IngressClassName', '');
    }
  }, [
    handleIngressChange,
    ingressClassOptions,
    ingressControllersQuery.isSuccess,
    ingressRule.IngressClassName,
  ]);

  const secrets = secretsResults?.data?.filter(
    (config) =>
      config.type === 'kubernetes.io/tls' &&
      config.metadata?.namespace === namespace
  );
  const tlsOptions: Option<string>[] = useMemo(
    () => [
      { label: 'No TLS', value: '' },
      ...(secrets?.map((config) => ({
        label: config.metadata?.name as string,
        value: config.metadata?.name as string,
      })) || []),
    ],
    [secrets]
  );

  useEffect(() => {
    if (
      !!params.name &&
      ingressesResults.data &&
      !ingressRule.IngressName &&
      !ingressControllersQuery.isLoading &&
      !ingressControllersQuery.isLoading
    ) {
      // if it is an edit screen, prepare the rule from the ingress
      const ing = ingressesResults.data?.find(
        (ing) => ing.Name === params.name && ing.Namespace === params.namespace
      );
      if (ing) {
        const type = ingressControllers?.find(
          (c) =>
            c.ClassName === ing.ClassName ||
            (c.Type === 'custom' && !ing.ClassName)
        )?.Type;
        const r = prepareRuleFromIngress(ing, type);
        r.IngressType = type || r.IngressType;
        setIngressRule(r);
        setIsEditClassNameSet(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.name,
    ingressesResults.data,
    ingressControllers,
    ingressRule.IngressName,
    params.namespace,
  ]);

  useEffect(() => {
    // for each host, if the tls selection doesn't exist as an option, change it to the first option
    if (ingressRule?.Hosts?.length) {
      ingressRule.Hosts.forEach((host, hIndex) => {
        const secret = host.Secret || '';
        const tlsOptionVals = tlsOptions.map((o) => o.value);
        if (tlsOptions?.length && !tlsOptionVals?.includes(secret)) {
          handleTLSChange(hIndex, tlsOptionVals[0]);
        }
      });
    }
  }, [tlsOptions, ingressRule.Hosts]);

  useEffect(() => {
    // for each path in each host, if the service port doesn't exist as an option, change it to the first option
    if (ingressRule?.Hosts?.length) {
      ingressRule.Hosts.forEach((host, hIndex) => {
        host?.Paths?.forEach((path, pIndex) => {
          const serviceName = path.ServiceName;
          const currentServicePorts = servicePorts[serviceName]?.map(
            (p) => p.value
          );
          if (
            currentServicePorts?.length &&
            !currentServicePorts?.includes(String(path.ServicePort))
          ) {
            handlePathChange(
              hIndex,
              pIndex,
              'ServicePort',
              currentServicePorts[0]
            );
          }
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingressRule, servicePorts]);

  const validate = useCallback(
    (
      ingressRule: Rule,
      ingressNames: string[],
      groupedServiceOptions: GroupedServiceOptions,
      existingIngressClass?: IngressController
    ) => {
      const errors: Record<string, ReactNode> = {};
      const rule = { ...ingressRule };

      // User cannot edit the namespace and the ingress name
      if (!isEdit) {
        if (!rule.Namespace) {
          errors.namespace = 'Namespace is required';
        }

        const nameRegex = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;
        if (!rule.IngressName) {
          errors.ingressName = 'Ingress name is required';
        } else if (!nameRegex.test(rule.IngressName)) {
          errors.ingressName =
            "This field must consist of lower case alphanumeric characters or '-', contain at most 63 characters, start with an alphabetic character, and end with an alphanumeric character (e.g. 'my-name', or 'abc-123').";
        } else if (ingressNames.includes(rule.IngressName)) {
          errors.ingressName = 'Ingress name already exists';
        }

        if (
          (!ingressClassOptions.length || !rule.IngressClassName) &&
          ingressControllersQuery.isSuccess
        ) {
          errors.className = 'Ingress class is required';
        }
      }

      if (isEdit && !ingressRule.IngressClassName && isEditClassNameSet) {
        errors.className =
          'No ingress class is currently set for this ingress - use of the Portainer UI requires one to be set.';
      }

      if (
        isEdit &&
        (!existingIngressClass ||
          (existingIngressClass && !existingIngressClass.Availability)) &&
        ingressRule.IngressClassName
      ) {
        if (!rule.IngressType) {
          errors.className =
            'Currently set to an ingress class that cannot be found in the cluster - you must select a valid class.';
        } else {
          errors.className =
            'Currently set to an ingress class that you do not have access to - you must select a valid class.';
        }
      }

      const duplicatedAnnotations: string[] = [];
      const re = /^([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9]$/;
      rule.Annotations?.forEach((a, i) => {
        if (!a.key) {
          errors[`annotations.key[${i}]`] = 'Key is required.';
        } else if (duplicatedAnnotations.includes(a.key)) {
          errors[`annotations.key[${i}]`] =
            'Key is a duplicate of an existing one.';
        } else {
          const key = a.key.split('/');
          if (key.length > 2) {
            errors[`annotations.key[${i}]`] =
              'Two segments are allowed, separated by a slash (/): a prefix (optional) and a name.';
          } else if (key.length === 2) {
            if (key[0].length > 253) {
              errors[`annotations.key[${i}]`] =
                "Prefix (before the slash) can't exceed 253 characters.";
            } else if (key[1].length > 63) {
              errors[`annotations.key[${i}]`] =
                "Name (after the slash) can't exceed 63 characters.";
            } else if (!re.test(key[1])) {
              errors[`annotations.key[${i}]`] =
                'Start and end with alphanumeric characters only, limiting characters in between to dashes, underscores, and alphanumerics.';
            }
          } else if (key.length === 1) {
            if (key[0].length > 63) {
              errors[`annotations.key[${i}]`] =
                "Name (the segment after a slash (/), or only segment if no slash) can't exceed 63 characters.";
            } else if (!re.test(key[0])) {
              errors[`annotations.key[${i}]`] =
                'Start and end with alphanumeric characters only, limiting characters in between to dashes, underscores, and alphanumerics.';
            }
          }
        }
        if (!a.value) {
          errors[`annotations.value[${i}]`] = 'Value is required.';
        }
        duplicatedAnnotations.push(a.key);
      });

      const duplicatedHosts: string[] = [];
      // Check if the paths are duplicates
      rule.Hosts?.forEach((host, hi) => {
        if (!host.NoHost) {
          if (!host.Host) {
            errors[`hosts[${hi}].host`] = 'Host is required';
          } else if (duplicatedHosts.includes(host.Host)) {
            errors[`hosts[${hi}].host`] = 'Host cannot be duplicated';
          }
          duplicatedHosts.push(host.Host);
        }

        // Validate service
        host.Paths?.forEach((path, pi) => {
          if (!path.ServiceName) {
            errors[`hosts[${hi}].paths[${pi}].servicename`] =
              'Service name is required';
          }

          const availableServiceNames = groupedServiceOptions.flatMap(
            (optionGroup) => optionGroup.options.map((option) => option.value)
          );

          if (
            isEdit &&
            path.ServiceName &&
            !availableServiceNames.find((sn) => sn === path.ServiceName)
          ) {
            errors[`hosts[${hi}].paths[${pi}].servicename`] = (
              <span>
                Currently set to {path.ServiceName}, which does not exist. You
                can create a service with this name for a particular deployment
                via{' '}
                <Link
                  to="kubernetes.applications"
                  params={{ id: environmentId }}
                  className="text-primary"
                  target="_blank"
                  data-cy="ingresses-create-application-link"
                >
                  Applications
                </Link>
                , and on returning here it will be picked up.
              </span>
            );
          }

          if (!path.ServicePort) {
            errors[`hosts[${hi}].paths[${pi}].serviceport`] =
              'Service port is required';
          }
        });
        // Validate paths
        const paths = host.Paths.map((path) => path.Route);
        paths.forEach((item, idx) => {
          if (!item) {
            errors[`hosts[${hi}].paths[${idx}].path`] = 'Path cannot be empty';
          } else if (paths.indexOf(item) !== idx) {
            errors[`hosts[${hi}].paths[${idx}].path`] =
              'Paths cannot be duplicated';
          } else {
            // Validate host and path combination globally
            const isExists = checkIfPathExistsWithHost(
              ingresses,
              host.Host,
              item,
              params.name
            );
            if (isExists) {
              errors[`hosts[${hi}].paths[${idx}].path`] =
                'Path is already in use with the same host';
            }
          }
        });
      });

      setErrors(errors);
      if (Object.keys(errors).length > 0) {
        return false;
      }
      return true;
    },
    [
      isEdit,
      isEditClassNameSet,
      ingressClassOptions.length,
      ingressControllersQuery.isSuccess,
      environmentId,
      ingresses,
      params.name,
    ]
  );

  const debouncedValidate = useMemo(() => debounce(validate, 500), [validate]);

  useEffect(() => {
    if (namespace.length > 0) {
      debouncedValidate(
        ingressRule,
        ingressNames || [],
        serviceOptions || [],
        existingIngressClass
      );
    }
  }, [
    ingressRule,
    namespace,
    ingressNames,
    serviceOptions,
    existingIngressClass,
    debouncedValidate,
  ]);

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit ingress' : 'Create ingress'}
        breadcrumbs={[
          {
            link: 'kubernetes.ingresses',
            label: 'Ingresses',
          },
          {
            label: isEdit ? 'Edit ingress' : 'Create ingress',
          },
        ]}
        reload
      />
      <div className="row ingress-rules">
        <div className="col-sm-12">
          <IngressForm
            environmentID={environmentId}
            isEdit={isEdit}
            rule={ingressRule}
            ingressClassOptions={ingressClassOptions}
            isIngressClassOptionsLoading={ingressControllersQuery.isLoading}
            errors={errors}
            servicePorts={servicePorts}
            tlsOptions={tlsOptions}
            serviceOptions={serviceOptions}
            addNewIngressHost={addNewIngressHost}
            handleTLSChange={handleTLSChange}
            handleHostChange={handleHostChange}
            handleIngressChange={handleIngressChange}
            handlePathChange={handlePathChange}
            addNewIngressRoute={addNewIngressRoute}
            removeIngressHost={removeIngressHost}
            removeIngressRoute={removeIngressRoute}
            addNewAnnotation={addNewAnnotation}
            removeAnnotation={removeAnnotation}
            reloadTLSCerts={reloadTLSCerts}
            handleAnnotationChange={handleAnnotationChange}
            namespace={namespace}
            handleNamespaceChange={handleNamespaceChange}
            namespacesOptions={namespaceOptions}
            isNamespaceOptionsLoading={namespacesQuery.isLoading}
            // wait for ingress results too to set a name that's not taken with handleNamespaceChange()
            isIngressNamesLoading={ingressesResults.isLoading}
          />
        </div>
        {namespace && (
          <div className="col-sm-12">
            <Button
              onClick={() => handleCreateIngressRules()}
              data-cy="ingresses-create-button"
              disabled={Object.keys(errors).length > 0}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  function handleNamespaceChange(ns: string) {
    setNamespace(ns);
    if (!isEdit) {
      addNewIngress(ns);
    }
  }

  function handleTLSChange(hostIndex: number, tls: string) {
    setIngressRule((prevRules) => {
      const rule = { ...prevRules };
      rule.Hosts[hostIndex] = { ...rule.Hosts[hostIndex], Secret: tls };
      return rule;
    });
  }

  function handleHostChange(hostIndex: number, val: string) {
    setIngressRule((prevRules) => {
      const rule = { ...prevRules };
      rule.Hosts[hostIndex] = { ...rule.Hosts[hostIndex], Host: val };
      rule.Hosts[hostIndex].Secret =
        hostWithTLS[val] || rule.Hosts[hostIndex].Secret;
      return rule;
    });
  }

  function handlePathChange(
    hostIndex: number,
    pathIndex: number,
    key: 'Route' | 'PathType' | 'ServiceName' | 'ServicePort',
    val: string
  ) {
    setIngressRule((prevRules) => {
      const rule = { ...prevRules };
      const h = { ...rule.Hosts[hostIndex] };
      h.Paths[pathIndex] = {
        ...h.Paths[pathIndex],
        [key]: key === 'ServicePort' ? Number(val) : val,
      };

      // set the first port of the service as the default port
      if (
        key === 'ServiceName' &&
        servicePorts[val] &&
        servicePorts[val].length > 0
      ) {
        h.Paths[pathIndex].ServicePort = Number(servicePorts[val][0].value);
      }

      rule.Hosts[hostIndex] = h;
      return rule;
    });
  }

  function handleAnnotationChange(
    index: number,
    key: 'key' | 'value',
    val: string
  ) {
    setIngressRule((prevRules) => {
      const rules = { ...prevRules };

      rules.Annotations = rules.Annotations || [];
      rules.Annotations[index] = rules.Annotations[index] || {
        key: '',
        value: '',
      };
      rules.Annotations[index][key] = val;

      return rules;
    });
  }

  function addNewIngress(namespace: string) {
    const newKey = `${namespace}-ingress-${
      (ruleCounterByNamespace[namespace] || 0) + 1
    }`;

    const host: Host = {
      Host: '',
      Secret: '',
      Paths: [],
      Key: uuidv4(),
    };

    const rule: Rule = {
      Key: uuidv4(),
      Namespace: namespace,
      IngressName: newKey,
      IngressClassName: ingressRule.IngressClassName || '',
      IngressType: ingressRule.IngressType || '',
      Hosts: [host],
    };

    setIngressRule(rule);
  }

  function addNewIngressHost(noHost = false) {
    const rule = { ...ingressRule };

    const path: Path = {
      Key: uuidv4(),
      ServiceName: '',
      ServicePort: 0,
      Route: '',
      PathType: 'Prefix',
    };

    const host: Host = {
      Host: '',
      Secret: '',
      Paths: noHost ? [path] : [],
      NoHost: noHost,
      Key: uuidv4(),
    };

    rule.Hosts.push(host);
    setIngressRule(rule);
  }

  function addNewIngressRoute(hostIndex: number) {
    const rule = { ...ingressRule };

    const path: Path = {
      ServiceName: '',
      ServicePort: 0,
      Route: '',
      PathType: 'Prefix',
      Key: uuidv4(),
    };

    rule.Hosts[hostIndex].Paths.push(path);
    setIngressRule(rule);
  }

  function addNewAnnotation(type?: 'rewrite' | 'regex' | 'ingressClass') {
    const rule = { ...ingressRule };

    const annotation: Annotation = {
      key: '',
      value: '',
      id: uuidv4(),
    };
    switch (type) {
      case 'rewrite':
        annotation.key = 'nginx.ingress.kubernetes.io/rewrite-target';
        annotation.value = '/$1';
        break;
      case 'regex':
        annotation.key = 'nginx.ingress.kubernetes.io/use-regex';
        annotation.value = 'true';
        break;
      case 'ingressClass':
        annotation.key = 'kubernetes.io/ingress.class';
        annotation.value = '';
        break;
      default:
        break;
    }
    rule.Annotations = rule.Annotations || [];
    rule.Annotations?.push(annotation);
    setIngressRule(rule);
  }

  function removeAnnotation(index: number) {
    const rule = { ...ingressRule };

    if (index > -1) {
      rule.Annotations?.splice(index, 1);
    }

    setIngressRule(rule);
  }

  function removeIngressRoute(hostIndex: number, pathIndex: number) {
    const rule = { ...ingressRule, Hosts: [...ingressRule.Hosts] };
    if (hostIndex > -1 && pathIndex > -1) {
      rule.Hosts[hostIndex].Paths.splice(pathIndex, 1);
    }
    setIngressRule(rule);
  }

  function removeIngressHost(hostIndex: number) {
    const rule = { ...ingressRule, Hosts: [...ingressRule.Hosts] };
    if (hostIndex > -1) {
      rule.Hosts.splice(hostIndex, 1);
    }
    setIngressRule(rule);
  }

  function reloadTLSCerts() {
    secretsResults.refetch();
  }

  function handleCreateIngressRules() {
    const rule = { ...ingressRule };

    const classNameToSend =
      rule.IngressClassName === 'none' ? '' : rule.IngressClassName;

    const ingress: Ingress = {
      Namespace: namespace,
      Name: rule.IngressName,
      ClassName: classNameToSend,
      Hosts: rule.Hosts.map((host) => host.Host),
      Paths: preparePaths(rule.IngressName, rule.Hosts),
      TLS: prepareTLS(rule.Hosts),
      Annotations: prepareAnnotations(rule.Annotations || []),
      Labels: rule.Labels,
    };

    if (isEdit) {
      updateIngressMutation.mutate(
        { environmentId, ingress },
        {
          onSuccess: () => {
            notifySuccess('Success', 'Ingress updated successfully');
            router.stateService.go('kubernetes.ingresses');
          },
        }
      );
    } else {
      createIngressMutation.mutate(
        { environmentId, ingress },
        {
          onSuccess: () => {
            notifySuccess('Success', 'Ingress created successfully');
            router.stateService.go('kubernetes.ingresses');
          },
        }
      );
    }
  }
}
