import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { v4 as uuidv4 } from 'uuid';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { useConfigurations } from '@/react/kubernetes/configs/queries';
import { useNamespaces } from '@/react/kubernetes/namespaces/queries';
import { Annotation } from '@/kubernetes/react/views/networks/ingresses/components/annotations/types';
import { useServices } from '@/kubernetes/react/views/networks/services/queries';
import { notifySuccess } from '@/portainer/services/notifications';

import { Link } from '@@/Link';
import { PageHeader } from '@@/PageHeader';
import { Option } from '@@/form-components/Input/Select';
import { Button } from '@@/buttons';

import { Ingress } from '../types';
import {
  useCreateIngress,
  useIngresses,
  useUpdateIngress,
  useIngressControllers,
} from '../queries';

import { Rule, Path, Host } from './types';
import { IngressForm } from './IngressForm';
import {
  prepareTLS,
  preparePaths,
  prepareAnnotations,
  prepareRuleFromIngress,
  checkIfPathExistsWithHost,
} from './utils';

export function CreateIngressView() {
  const environmentId = useEnvironmentId();
  const { params } = useCurrentStateAndParams();

  const router = useRouter();
  const isEdit = !!params.namespace;

  const [namespace, setNamespace] = useState<string>(params.namespace || '');
  const [ingressRule, setIngressRule] = useState<Rule>({} as Rule);

  const [errors, setErrors] = useState<Record<string, ReactNode>>(
    {} as Record<string, string>
  );

  const namespacesResults = useNamespaces(environmentId);

  const servicesResults = useServices(environmentId, namespace);
  const configResults = useConfigurations(environmentId, namespace);
  const ingressesResults = useIngresses(
    environmentId,
    namespacesResults.data ? Object.keys(namespacesResults?.data || {}) : []
  );
  const ingressControllersResults = useIngressControllers(
    environmentId,
    namespace
  );

  const createIngressMutation = useCreateIngress();
  const updateIngressMutation = useUpdateIngress();

  const isLoading =
    (servicesResults.isLoading &&
      configResults.isLoading &&
      namespacesResults.isLoading &&
      ingressesResults.isLoading) ||
    (isEdit && !ingressRule.IngressName);

  const [ingressNames, ingresses, ruleCounterByNamespace, hostWithTLS] =
    useMemo((): [
      string[],
      Ingress[],
      Record<string, number>,
      Record<string, string>
    ] => {
      const ruleCounterByNamespace: Record<string, number> = {};
      const hostWithTLS: Record<string, string> = {};
      ingressesResults.data?.forEach((ingress) => {
        ingress.TLS?.forEach((tls) => {
          tls.Hosts.forEach((host) => {
            hostWithTLS[host] = tls.SecretName;
          });
        });
      });
      const ingressNames: string[] = [];
      ingressesResults.data?.forEach((ing) => {
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

  const namespacesOptions: Option<string>[] = [
    { label: 'Select a namespace', value: '' },
  ];
  Object.entries(namespacesResults?.data || {}).forEach(([ns, val]) => {
    if (!val.IsSystem) {
      namespacesOptions.push({
        label: ns,
        value: ns,
      });
    }
  });

  const clusterIpServices = useMemo(
    () => servicesResults.data?.filter((s) => s.Type === 'ClusterIP'),
    [servicesResults.data]
  );
  const servicesOptions = useMemo(
    () =>
      clusterIpServices?.map((service) => ({
        label: service.Name,
        value: service.Name,
      })),
    [clusterIpServices]
  );

  const serviceOptions = [
    { label: 'Select a service', value: '' },
    ...(servicesOptions || []),
  ];
  const servicePorts = clusterIpServices
    ? Object.fromEntries(
        clusterIpServices?.map((service) => [
          service.Name,
          service.Ports.map((port) => ({
            label: String(port.Port),
            value: String(port.Port),
          })),
        ])
      )
    : {};

  const existingIngressClass = useMemo(
    () =>
      ingressControllersResults.data?.find(
        (i) => i.ClassName === ingressRule.IngressClassName
      ),
    [ingressControllersResults.data, ingressRule.IngressClassName]
  );
  const ingressClassOptions: Option<string>[] = [
    { label: 'Select an ingress class', value: '' },
    ...(ingressControllersResults.data?.map((cls) => ({
      label: cls.ClassName,
      value: cls.ClassName,
    })) || []),
  ];

  if (!existingIngressClass && ingressRule.IngressClassName) {
    ingressClassOptions.push({
      label: !ingressRule.IngressType
        ? `${ingressRule.IngressClassName} - NOT FOUND`
        : `${ingressRule.IngressClassName} - DISALLOWED`,
      value: ingressRule.IngressClassName,
    });
  }

  const matchedConfigs = configResults?.data?.filter(
    (config) =>
      config.SecretType === 'kubernetes.io/tls' &&
      config.Namespace === namespace
  );
  const tlsOptions: Option<string>[] = [
    { label: 'No TLS', value: '' },
    ...(matchedConfigs?.map((config) => ({
      label: config.Name,
      value: config.Name,
    })) || []),
  ];

  useEffect(() => {
    if (!!params.name && ingressesResults.data && !ingressRule.IngressName) {
      // if it is an edit screen, prepare the rule from the ingress
      const ing = ingressesResults.data?.find(
        (ing) => ing.Name === params.name && ing.Namespace === params.namespace
      );
      if (ing) {
        const type = ingressControllersResults.data?.find(
          (c) => c.ClassName === ing.ClassName
        )?.Type;
        const r = prepareRuleFromIngress(ing);
        r.IngressType = type;
        setIngressRule(r);
      }
    }
  }, [
    params.name,
    ingressesResults.data,
    ingressControllersResults.data,
    ingressRule.IngressName,
    params.namespace,
  ]);

  useEffect(() => {
    if (namespace.length > 0) {
      validate(
        ingressRule,
        ingressNames || [],
        servicesOptions || [],
        !!existingIngressClass
      );
    }
  }, [
    ingressRule,
    namespace,
    ingressNames,
    servicesOptions,
    existingIngressClass,
  ]);

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit ingress' : 'Add ingress'}
        breadcrumbs={[
          {
            link: 'kubernetes.ingresses',
            label: 'Ingresses',
          },
          {
            label: isEdit ? 'Edit ingress' : 'Add ingress',
          },
        ]}
      />
      <div className="row ingress-rules">
        <div className="col-sm-12">
          <IngressForm
            environmentID={environmentId}
            isLoading={isLoading}
            isEdit={isEdit}
            rule={ingressRule}
            ingressClassOptions={ingressClassOptions}
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
            namespacesOptions={namespacesOptions}
          />
        </div>
        {namespace && !isLoading && (
          <div className="col-sm-12">
            <Button
              onClick={() => handleCreateIngressRules()}
              disabled={Object.keys(errors).length > 0}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  function validate(
    ingressRule: Rule,
    ingressNames: string[],
    serviceOptions: Option<string>[],
    existingIngressClass: boolean
  ) {
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

      if (!rule.IngressClassName) {
        errors.className = 'Ingress class is required';
      }
    }

    if (isEdit && !ingressRule.IngressClassName) {
      errors.className =
        'No ingress class is currently set for this ingress - use of the Portainer UI requires one to be set.';
    }

    if (isEdit && !existingIngressClass && ingressRule.IngressClassName) {
      if (!rule.IngressType) {
        errors.className =
          'Currently set to an ingress class that cannot be found in the cluster - you must select a valid class.';
      } else {
        errors.className =
          'Currently set to an ingress class that you do not have access to - you must select a valid class.';
      }
    }

    const duplicatedAnnotations: string[] = [];
    rule.Annotations?.forEach((a, i) => {
      if (!a.Key) {
        errors[`annotations.key[${i}]`] = 'Annotation key is required';
      } else if (duplicatedAnnotations.includes(a.Key)) {
        errors[`annotations.key[${i}]`] = 'Annotation cannot be duplicated';
      }
      if (!a.Value) {
        errors[`annotations.value[${i}]`] = 'Annotation value is required';
      }
      duplicatedAnnotations.push(a.Key);
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

        if (
          isEdit &&
          path.ServiceName &&
          !serviceOptions.find((s) => s.value === path.ServiceName)
        ) {
          errors[`hosts[${hi}].paths[${pi}].servicename`] = (
            <span>
              Currently set to {path.ServiceName}, which does not exist. You can
              create a service with this name for a particular deployment via{' '}
              <Link
                to="kubernetes.applications"
                params={{ id: environmentId }}
                className="text-primary"
                target="_blank"
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
  }

  function handleNamespaceChange(ns: string) {
    setNamespace(ns);
    if (!isEdit) {
      addNewIngress(ns);
    }
  }

  function handleIngressChange(key: string, val: string) {
    setIngressRule((prevRules) => {
      const rule = { ...prevRules, [key]: val };
      if (key === 'IngressClassName') {
        rule.IngressType = ingressControllersResults.data?.find(
          (c) => c.ClassName === val
        )?.Type;
      }
      return rule;
    });
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
    key: 'Key' | 'Value',
    val: string
  ) {
    setIngressRule((prevRules) => {
      const rules = { ...prevRules };

      rules.Annotations = rules.Annotations || [];
      rules.Annotations[index] = rules.Annotations[index] || {
        Key: '',
        Value: '',
      };
      rules.Annotations[index][key] = val;

      return rules;
    });
  }

  function addNewIngress(namespace: string) {
    const newKey = `${namespace}-ingress-${
      (ruleCounterByNamespace[namespace] || 0) + 1
    }`;
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
      Paths: [path],
      Key: uuidv4(),
    };

    const rule: Rule = {
      Key: uuidv4(),
      Namespace: namespace,
      IngressName: newKey,
      IngressClassName: '',
      Hosts: [host],
    };

    setIngressRule(rule);
  }

  function addNewIngressHost(noHost = false) {
    const rule = { ...ingressRule };

    const path: Path = {
      ServiceName: '',
      ServicePort: 0,
      Route: '',
      PathType: 'Prefix',
      Key: uuidv4(),
    };

    const host: Host = {
      Host: '',
      Secret: '',
      Paths: [path],
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

  function addNewAnnotation(type?: 'rewrite' | 'regex') {
    const rule = { ...ingressRule };

    const annotation: Annotation = {
      Key: '',
      Value: '',
      ID: uuidv4(),
    };
    if (type === 'rewrite') {
      annotation.Key = 'nginx.ingress.kubernetes.io/rewrite-target';
      annotation.Value = '/$1';
    }
    if (type === 'regex') {
      annotation.Key = 'nginx.ingress.kubernetes.io/use-regex';
      annotation.Value = 'true';
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
    configResults.refetch();
  }

  function handleCreateIngressRules() {
    const rule = { ...ingressRule };

    const ingress: Ingress = {
      Namespace: namespace,
      Name: rule.IngressName,
      ClassName: rule.IngressClassName,
      Hosts: rule.Hosts.map((host) => host.Host),
      Paths: preparePaths(rule.IngressName, rule.Hosts),
      TLS: prepareTLS(rule.Hosts),
      Annotations: prepareAnnotations(rule.Annotations || []),
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
