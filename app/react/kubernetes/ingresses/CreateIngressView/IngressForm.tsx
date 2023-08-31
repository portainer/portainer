import { ChangeEvent, ReactNode, useEffect } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

import Route from '@/assets/ico/route.svg?c';

import { Link } from '@@/Link';
import { Option } from '@@/form-components/Input/Select';
import { FormError } from '@@/form-components/FormError';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Tooltip } from '@@/Tip/Tooltip';
import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { TextTip } from '@@/Tip/TextTip';
import { Card } from '@@/Card';
import { InputGroup } from '@@/form-components/InputGroup';
import { InlineLoader } from '@@/InlineLoader';
import { Select } from '@@/form-components/ReactSelect';

import { Annotations } from './Annotations';
import { GroupedServiceOptions, Rule, ServicePorts } from './types';

import '../style.css';

const PathTypes: Record<string, string[]> = {
  nginx: ['ImplementationSpecific', 'Prefix', 'Exact'],
  traefik: ['Prefix', 'Exact'],
  other: ['Prefix', 'Exact'],
};
const PlaceholderAnnotations: Record<string, string[]> = {
  nginx: ['e.g. nginx.ingress.kubernetes.io/rewrite-target', '/$1'],
  traefik: ['e.g. traefik.ingress.kubernetes.io/router.tls', 'true'],
  other: ['e.g. app.kubernetes.io/name', 'examplename'],
};

interface Props {
  environmentID: number;
  rule: Rule;

  errors: Record<string, ReactNode>;
  isEdit: boolean;
  namespace: string;

  servicePorts: ServicePorts;
  ingressClassOptions: Option<string>[];
  isIngressClassOptionsLoading: boolean;
  serviceOptions: GroupedServiceOptions;
  tlsOptions: Option<string>[];
  namespacesOptions: Option<string>[];
  isNamespaceOptionsLoading: boolean;
  isIngressNamesLoading: boolean;

  removeIngressRoute: (hostIndex: number, pathIndex: number) => void;
  removeIngressHost: (hostIndex: number) => void;
  removeAnnotation: (index: number) => void;

  addNewIngressHost: (noHost?: boolean) => void;
  addNewIngressRoute: (hostIndex: number) => void;
  addNewAnnotation: (type?: 'rewrite' | 'regex' | 'ingressClass') => void;

  handleNamespaceChange: (val: string) => void;
  handleHostChange: (hostIndex: number, val: string) => void;
  handleTLSChange: (hostIndex: number, tls: string) => void;
  handleIngressChange: (
    key: 'IngressName' | 'IngressClassName',
    value: string
  ) => void;
  handleAnnotationChange: (
    index: number,
    key: 'Key' | 'Value',
    val: string
  ) => void;
  handlePathChange: (
    hostIndex: number,
    pathIndex: number,
    key: 'Route' | 'PathType' | 'ServiceName' | 'ServicePort',
    val: string
  ) => void;

  reloadTLSCerts: () => void;
}

export function IngressForm({
  environmentID,
  rule,
  isEdit,
  servicePorts,
  tlsOptions,
  handleTLSChange,
  addNewIngressHost,
  serviceOptions,
  handleHostChange,
  handleIngressChange,
  handlePathChange,
  addNewIngressRoute,
  removeIngressRoute,
  removeIngressHost,
  addNewAnnotation,
  removeAnnotation,
  reloadTLSCerts,
  handleAnnotationChange,
  ingressClassOptions,
  isIngressClassOptionsLoading,
  errors,
  namespacesOptions,
  isNamespaceOptionsLoading,
  isIngressNamesLoading,
  handleNamespaceChange,
  namespace,
}: Props) {
  const hasNoHostRule = rule.Hosts?.some((host) => host.NoHost);
  const placeholderAnnotation =
    PlaceholderAnnotations[rule.IngressType || 'other'] ||
    PlaceholderAnnotations.other;
  const pathTypes = PathTypes[rule.IngressType || 'other'] || PathTypes.other;

  // when the namespace options update the value to an available one
  useEffect(() => {
    const namespaces = namespacesOptions.map((option) => option.value);
    if (
      !isEdit &&
      !namespaces.includes(namespace) &&
      namespaces.length > 0 &&
      !isIngressNamesLoading
    ) {
      handleNamespaceChange(namespaces[0]);
    }
  }, [
    namespacesOptions,
    namespace,
    handleNamespaceChange,
    isNamespaceOptionsLoading,
    isEdit,
    isIngressNamesLoading,
  ]);

  return (
    <Widget>
      <WidgetTitle icon={Route} title="Ingress" />
      <WidgetBody key={rule.Key + rule.Namespace}>
        <div className="row">
          <div className="form-horizontal">
            <div className="form-group">
              <label
                className="control-label text-muted col-sm-3 col-lg-2"
                htmlFor="namespace"
              >
                Namespace
              </label>
              {isNamespaceOptionsLoading && (
                <div className="col-sm-4">
                  <InlineLoader className="pt-2">
                    Loading namespaces...
                  </InlineLoader>
                </div>
              )}
              {!isNamespaceOptionsLoading && (
                <div className={`col-sm-4 ${isEdit && 'control-label'}`}>
                  {isEdit ? (
                    namespace
                  ) : (
                    <Select
                      name="namespaces"
                      options={namespacesOptions}
                      value={
                        namespace
                          ? { value: namespace, label: namespace }
                          : null
                      }
                      isDisabled={isEdit}
                      onChange={(val) =>
                        handleNamespaceChange(val?.value || '')
                      }
                      placeholder={
                        namespacesOptions.length
                          ? 'Select a namespace'
                          : 'No namespaces available'
                      }
                      noOptionsMessage={() => 'No namespaces available'}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {namespace && (
          <div className="row">
            <div className="form-horizontal">
              <div className="form-group">
                <label
                  className="control-label text-muted col-sm-3 col-lg-2 required"
                  htmlFor="ingress_name"
                >
                  Ingress name
                </label>
                <div className="col-sm-4">
                  {isEdit ? (
                    rule.IngressName
                  ) : (
                    <input
                      name="ingress_name"
                      type="text"
                      className="form-control"
                      placeholder="Ingress name"
                      defaultValue={rule.IngressName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleIngressChange('IngressName', e.target.value)
                      }
                      disabled={isEdit}
                    />
                  )}
                  {errors.ingressName && !isEdit && (
                    <FormError className="error-inline mt-1">
                      {errors.ingressName}
                    </FormError>
                  )}
                </div>
              </div>

              <div className="form-group" key={ingressClassOptions.toString()}>
                <label
                  className="control-label text-muted col-sm-3 col-lg-2 required"
                  htmlFor="ingress_class"
                >
                  Ingress class
                </label>
                <div className="col-sm-4">
                  {isIngressClassOptionsLoading && (
                    <InlineLoader className="pt-2">
                      Loading ingress classes...
                    </InlineLoader>
                  )}
                  {!isIngressClassOptionsLoading && (
                    <>
                      <Select
                        name="ingress_class"
                        placeholder={
                          ingressClassOptions.length
                            ? 'Select an ingress class'
                            : 'No ingress classes available'
                        }
                        options={ingressClassOptions}
                        value={
                          rule.IngressClassName
                            ? {
                                label: rule.IngressClassName,
                                value: rule.IngressClassName,
                              }
                            : null
                        }
                        onChange={(ingressClassOption) =>
                          handleIngressChange(
                            'IngressClassName',
                            ingressClassOption?.value || ''
                          )
                        }
                        noOptionsMessage={() => 'No ingress classes available'}
                      />
                      {errors.className && (
                        <FormError className="error-inline mt-1">
                          {errors.className}
                        </FormError>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="col-sm-12 text-muted !mb-0 px-0">
              <div className="control-label !mb-3 text-left font-medium">
                Annotations
                <Tooltip
                  message={
                    <div className="vertical-center">
                      <span>
                        Allows specifying of{' '}
                        <a
                          href="https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/"
                          target="_black"
                        >
                          annotations
                        </a>{' '}
                        for the object. See further Kubernetes documentation on{' '}
                        <a
                          href="https://kubernetes.io/docs/reference/labels-annotations-taints/"
                          target="_black"
                        >
                          well-known annotations
                        </a>
                        .
                      </span>
                    </div>
                  }
                />
              </div>
            </div>

            {rule?.Annotations && (
              <Annotations
                placeholder={placeholderAnnotation}
                annotations={rule.Annotations}
                handleAnnotationChange={handleAnnotationChange}
                removeAnnotation={removeAnnotation}
                errors={errors}
              />
            )}

            <div className="col-sm-12 anntation-actions p-0">
              <TooltipWithChildren message="Use annotations to configure options for an ingress. Review Nginx or Traefik documentation to find the annotations supported by your choice of ingress type.">
                <span>
                  <Button
                    className="btn btn-sm btn-light mb-2 !ml-0"
                    onClick={() => addNewAnnotation()}
                    icon={Plus}
                  >
                    {' '}
                    Add annotation
                  </Button>
                </span>
              </TooltipWithChildren>

              {rule.IngressType === 'nginx' && (
                <>
                  <TooltipWithChildren message="When the exposed URLs for your applications differ from the specified paths in the ingress, use the rewrite target annotation to denote the path to redirect to.">
                    <span>
                      <Button
                        className="btn btn-sm btn-light mb-2 ml-2"
                        onClick={() => addNewAnnotation('rewrite')}
                        icon={Plus}
                        data-cy="add-rewrite-annotation"
                      >
                        Add rewrite annotation
                      </Button>
                    </span>
                  </TooltipWithChildren>

                  <TooltipWithChildren message="Enable use of regular expressions in ingress paths (set in the ingress details of an application). Use this along with rewrite-target to specify the regex capturing group to be replaced, e.g. path regex of ^/foo/(,*) and rewrite-target of /bar/$1 rewrites example.com/foo/account to example.com/bar/account.">
                    <span>
                      <Button
                        className="btn btn-sm btn-light mb-2 ml-2"
                        onClick={() => addNewAnnotation('regex')}
                        icon={Plus}
                        data-cy="add-regex-annotation"
                      >
                        Add regular expression annotation
                      </Button>
                    </span>
                  </TooltipWithChildren>
                </>
              )}

              {rule.IngressType === 'custom' && (
                <Button
                  className="btn btn-sm btn-light mb-2 ml-2"
                  onClick={() => addNewAnnotation('ingressClass')}
                  icon={Plus}
                  data-cy="add-ingress-class-annotation"
                >
                  Add kubernetes.io/ingress.class annotation
                </Button>
              )}
            </div>

            <div className="col-sm-12 text-muted px-0">Rules</div>
          </div>
        )}

        {namespace &&
          rule?.Hosts?.map((host, hostIndex) => (
            <Card key={host.Key} className="mb-5">
              <div className="flex flex-col">
                <div className="row rule-actions">
                  <div className="col-sm-3 p-0">
                    {!host.NoHost ? 'Rule' : 'Fallback rule'}
                  </div>
                  <div className="col-sm-9 p-0 text-right">
                    <Button
                      className="btn btn-sm ml-2"
                      color="dangerlight"
                      type="button"
                      data-cy={`k8sAppCreate-rmHostButton_${hostIndex}`}
                      onClick={() => removeIngressHost(hostIndex)}
                      disabled={rule.Hosts.length === 1}
                      icon={Trash2}
                    >
                      Remove rule
                    </Button>
                  </div>
                </div>
                {!host.NoHost && (
                  <div className="row">
                    <div className="form-group col-sm-6 col-lg-4 !pl-0 !pr-2">
                      <InputGroup size="small">
                        <InputGroup.Addon required>Hostname</InputGroup.Addon>
                        <InputGroup.Input
                          name={`ingress_host_${hostIndex}`}
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. example.com"
                          defaultValue={host.Host}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleHostChange(hostIndex, e.target.value)
                          }
                        />
                      </InputGroup>
                      {errors[`hosts[${hostIndex}].host`] && (
                        <FormError className="mt-1 !mb-0">
                          {errors[`hosts[${hostIndex}].host`]}
                        </FormError>
                      )}
                    </div>

                    <div className="form-group col-sm-6 col-lg-4 !pr-0 !pl-2">
                      <InputGroup size="small">
                        <InputGroup.Addon>TLS secret</InputGroup.Addon>
                        <Select
                          key={tlsOptions.toString() + host.Secret}
                          name={`ingress_tls_${hostIndex}`}
                          value={
                            host.Secret !== undefined
                              ? {
                                  value: host.Secret,
                                  label: host.Secret || 'No TLS',
                                }
                              : null
                          }
                          onChange={(TLSOption) =>
                            handleTLSChange(hostIndex, TLSOption?.value || '')
                          }
                          placeholder={
                            tlsOptions.length
                              ? 'Select a TLS secret'
                              : 'No TLS secrets available'
                          }
                          noOptionsMessage={() => 'No TLS secrets available'}
                          size="sm"
                          options={tlsOptions}
                        />
                        {!host.NoHost && (
                          <div className="input-group-btn">
                            <Button
                              className="btn btn-light btn-sm !ml-0 !rounded-l-none"
                              onClick={() => reloadTLSCerts()}
                              icon={RefreshCw}
                            />
                          </div>
                        )}
                      </InputGroup>
                    </div>

                    <div className="col-sm-12 col-lg-4 flex h-[30px] items-center pl-2">
                      <TextTip color="blue">
                        You may also use the{' '}
                        <Link
                          to="kubernetes.secrets.new"
                          params={{ id: environmentID }}
                          className="text-primary"
                          target="_blank"
                        >
                          Create secret
                        </Link>{' '}
                        function, and reload the dropdown.
                      </TextTip>
                    </div>
                  </div>
                )}
                {host.NoHost && (
                  <TextTip color="blue">
                    A fallback rule has no host specified. This rule only
                    applies when an inbound request has a hostname that does not
                    match with any of your other rules.
                  </TextTip>
                )}

                <div className="row">
                  <div className="col-sm-12 text-muted !mb-0 mt-2 px-0">
                    Paths
                  </div>
                </div>

                {!host.Paths.length && (
                  <TextTip className="mt-2" color="blue">
                    You may save the ingress without a path and it will then be
                    an <b>ingress default</b> that a user may select via the
                    hostname dropdown in Create/Edit application.
                  </TextTip>
                )}

                {host.Paths.map((path, pathIndex) => (
                  <div
                    className="row path mt-5 !mb-5"
                    key={`path_${path.Key}}`}
                  >
                    <div className="form-group col-sm-3 col-xl-2 !m-0 !pl-0">
                      <InputGroup size="small">
                        <InputGroup.Addon required>Service</InputGroup.Addon>
                        <Select
                          key={serviceOptions.toString() + path.ServiceName}
                          name={`ingress_service_${hostIndex}_${pathIndex}`}
                          options={serviceOptions}
                          value={
                            path.ServiceName
                              ? {
                                  value: path.ServiceName,
                                  label: getServiceLabel(
                                    serviceOptions,
                                    path.ServiceName
                                  ),
                                }
                              : null
                          }
                          onChange={(serviceOption) =>
                            handlePathChange(
                              hostIndex,
                              pathIndex,
                              'ServiceName',
                              serviceOption?.value || ''
                            )
                          }
                          placeholder={
                            serviceOptions.length
                              ? 'Select a service'
                              : 'No services available'
                          }
                          noOptionsMessage={() => 'No services available'}
                          size="sm"
                        />
                      </InputGroup>
                      {errors[
                        `hosts[${hostIndex}].paths[${pathIndex}].servicename`
                      ] && (
                        <FormError className="error-inline mt-1 !mb-0">
                          {
                            errors[
                              `hosts[${hostIndex}].paths[${pathIndex}].servicename`
                            ]
                          }
                        </FormError>
                      )}
                    </div>

                    <div className="form-group col-sm-2 col-xl-2 !m-0 min-w-[170px] !pl-0">
                      {servicePorts && (
                        <>
                          <InputGroup size="small">
                            <InputGroup.Addon required>
                              Service port
                            </InputGroup.Addon>
                            <Select
                              key={servicePorts.toString() + path.ServicePort}
                              name={`ingress_servicePort_${hostIndex}_${pathIndex}`}
                              options={
                                servicePorts[path.ServiceName]?.map(
                                  (portOption) => ({
                                    ...portOption,
                                    value: portOption.value.toString(),
                                  })
                                ) || []
                              }
                              onChange={(option) =>
                                handlePathChange(
                                  hostIndex,
                                  pathIndex,
                                  'ServicePort',
                                  option?.value || ''
                                )
                              }
                              value={
                                path.ServicePort
                                  ? {
                                      label: path.ServicePort.toString(),
                                      value: path.ServicePort.toString(),
                                    }
                                  : null
                              }
                              placeholder={
                                servicePorts[path.ServiceName]?.length
                                  ? 'Select a port'
                                  : 'No ports available'
                              }
                              noOptionsMessage={() => 'No ports available'}
                              size="sm"
                            />
                          </InputGroup>
                          {errors[
                            `hosts[${hostIndex}].paths[${pathIndex}].serviceport`
                          ] && (
                            <FormError className="mt-1 !mb-0">
                              {
                                errors[
                                  `hosts[${hostIndex}].paths[${pathIndex}].serviceport`
                                ]
                              }
                            </FormError>
                          )}
                        </>
                      )}
                    </div>

                    <div className="form-group col-sm-3 col-xl-2 !m-0 !pl-0">
                      <InputGroup size="small">
                        <InputGroup.Addon>Path type</InputGroup.Addon>
                        <Select<Option<string>>
                          key={servicePorts.toString() + path.PathType}
                          name={`ingress_pathType_${hostIndex}_${pathIndex}`}
                          options={
                            pathTypes?.map((type) => ({
                              label: type,
                              value: type,
                            })) || []
                          }
                          onChange={(option) =>
                            handlePathChange(
                              hostIndex,
                              pathIndex,
                              'PathType',
                              option?.value || ''
                            )
                          }
                          value={
                            path.PathType
                              ? {
                                  label: path.PathType,
                                  value: path.PathType,
                                }
                              : null
                          }
                          placeholder={
                            pathTypes?.length
                              ? 'Select a path type'
                              : 'No path types available'
                          }
                          noOptionsMessage={() => 'No path types available'}
                          size="sm"
                        />
                      </InputGroup>
                      {errors[
                        `hosts[${hostIndex}].paths[${pathIndex}].pathType`
                      ] && (
                        <FormError className="mt-1 !mb-0">
                          {
                            errors[
                              `hosts[${hostIndex}].paths[${pathIndex}].pathType`
                            ]
                          }
                        </FormError>
                      )}
                    </div>

                    <div className="form-group col-sm-3 col-xl-3 !m-0 !pl-0">
                      <InputGroup size="small">
                        <InputGroup.Addon required>Path</InputGroup.Addon>
                        <InputGroup.Input
                          className="form-control"
                          name={`ingress_route_${hostIndex}-${pathIndex}`}
                          placeholder="/example"
                          data-pattern="/^(\/?[a-zA-Z0-9]+([a-zA-Z0-9-/_]*[a-zA-Z0-9])?|[a-zA-Z0-9]+)|(\/){1}$/"
                          data-cy={`k8sAppCreate-route_${hostIndex}-${pathIndex}`}
                          defaultValue={path.Route}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handlePathChange(
                              hostIndex,
                              pathIndex,
                              'Route',
                              e.target.value
                            )
                          }
                        />
                      </InputGroup>
                      {errors[
                        `hosts[${hostIndex}].paths[${pathIndex}].path`
                      ] && (
                        <FormError className="mt-1 !mb-0">
                          {
                            errors[
                              `hosts[${hostIndex}].paths[${pathIndex}].path`
                            ]
                          }
                        </FormError>
                      )}
                    </div>

                    <div className="form-group col-sm-1 !m-0 !pl-0">
                      <Button
                        className="!ml-0 h-[30px]"
                        color="dangerlight"
                        type="button"
                        data-cy={`k8sAppCreate-rmPortButton_${hostIndex}-${pathIndex}`}
                        onClick={() => removeIngressRoute(hostIndex, pathIndex)}
                        icon={Trash2}
                        size="small"
                        disabled={host.Paths.length === 1 && host.NoHost}
                      />
                    </div>
                  </div>
                ))}

                <div className="row mt-5">
                  <Button
                    className="!ml-0"
                    type="button"
                    onClick={() => addNewIngressRoute(hostIndex)}
                    icon={Plus}
                    size="small"
                    color="default"
                  >
                    Add path
                  </Button>
                </div>
              </div>
            </Card>
          ))}

        {namespace && (
          <div className="row rules-action p-0">
            <div className="col-sm-12 vertical-center p-0">
              <Button
                className="!ml-0"
                type="button"
                onClick={() => addNewIngressHost()}
                icon={Plus}
                color="default"
                size="small"
              >
                Add new host
              </Button>

              <Button
                className="ml-2"
                type="button"
                onClick={() => addNewIngressHost(true)}
                disabled={hasNoHostRule}
                icon={Plus}
                color="default"
                size="small"
              >
                Add fallback rule
              </Button>
              <Tooltip message="A fallback rule will be applied to all requests that do not match any of the defined hosts." />
            </div>
          </div>
        )}
      </WidgetBody>
    </Widget>
  );
}

function getServiceLabel(options: GroupedServiceOptions, value: string) {
  const allOptions = options.flatMap((group) => group.options);
  const option = allOptions.find((o) => o.value === value);
  return option?.selectedLabel || '';
}
