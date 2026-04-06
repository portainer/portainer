import { ChangeEvent, useEffect } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import Route from '@/assets/ico/route.svg?c';

import { Link } from '@@/Link';
import { Option } from '@@/form-components/Input/Select';
import { FormError } from '@@/form-components/FormError';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Tooltip } from '@@/Tip/Tooltip';
import { Button } from '@@/buttons';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { TextTip } from '@@/Tip/TextTip';
import { InlineLoader } from '@@/InlineLoader';
import { Select } from '@@/form-components/ReactSelect';
import { Card } from '@@/Card';
import { InputGroup } from '@@/form-components/InputGroup';
import { Input } from '@@/form-components/Input';

import { AnnotationsForm } from '../../annotations/AnnotationsForm';

import {
  GroupedServiceOptions,
  IngressErrors,
  Rule,
  ServicePorts,
} from './types';

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

  errors: IngressErrors;
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
    key: 'key' | 'value',
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
  const { t } = useTranslation();
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
      <WidgetTitle icon={Route} title={t('ingress_form.title')} />
      <WidgetBody key={rule.Key + rule.Namespace}>
        <div className="row">
          <div className="form-horizontal">
            <div className="form-group">
              <label
                className="control-label text-muted col-sm-3 col-lg-2"
                htmlFor="namespace"
              >
                {t('ingress_form.namespace')}
              </label>
              {isNamespaceOptionsLoading && (
                <div className="col-sm-4">
                  <InlineLoader className="pt-2">
                    {t('ingress_form.loading_namespaces')}
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
                          ? t('ingress_form.select_namespace')
                          : t('ingress_form.no_namespaces')
                      }
                      noOptionsMessage={() => t('ingress_form.no_namespaces')}
                      data-cy="k8sAppCreate-namespaceSelect"
                      id="k8sAppCreate-namespaceSelect"
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
                  {t('ingress_form.ingress_name')}
                </label>
                <div className="col-sm-4">
                  {isEdit ? (
                    rule.IngressName
                  ) : (
                    <Input
                      name="ingress_name"
                      type="text"
                      className="form-control"
                      placeholder={t('ingress_form.ingress_name')}
                      defaultValue={rule.IngressName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleIngressChange('IngressName', e.target.value)
                      }
                      disabled={isEdit}
                      data-cy="k8sAppCreate-ingressNameInput"
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
                  {t('ingress_form.ingress_class')}
                </label>
                <div className="col-sm-4">
                  {isIngressClassOptionsLoading && (
                    <InlineLoader className="pt-2">
                      {t('ingress_form.loading_ingress_classes')}
                    </InlineLoader>
                  )}
                  {!isIngressClassOptionsLoading && (
                    <>
                      <Select
                        name="ingress_class"
                        placeholder={
                          ingressClassOptions.length
                            ? t('ingress_form.select_ingress_class')
                            : t('ingress_form.no_ingress_classes')
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
                        noOptionsMessage={() => t('ingress_form.no_ingress_classes')}
                        data-cy="k8sAppCreate-ingressClassSelect"
                        id="k8sAppCreate-ingressClassSelect"
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
                {t('ingress_form.annotations')}
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
              <AnnotationsForm
                placeholder={placeholderAnnotation}
                annotations={rule.Annotations}
                handleAnnotationChange={handleAnnotationChange}
                removeAnnotation={removeAnnotation}
                errors={errors.annotations}
              />
            )}

            <div className="col-sm-12 anntation-actions p-0">
              <TooltipWithChildren message={t('ingress_form.add_annotation_tooltip')}>
                <span>
                  <Button
                    className="btn btn-sm btn-light !ml-0 mb-2"
                    data-cy="add-annotation-button"
                    onClick={() => addNewAnnotation()}
                    icon={Plus}
                  >
                    {' '}
                    {t('ingress_form.add_annotation')}
                  </Button>
                </span>
              </TooltipWithChildren>

              {rule.IngressType === 'nginx' && (
                <>
                  <TooltipWithChildren message={t('ingress_form.rewrite_annotation_tooltip')}>
                    <span>
                      <Button
                        className="btn btn-sm btn-light mb-2 ml-2"
                        onClick={() => addNewAnnotation('rewrite')}
                        icon={Plus}
                        data-cy="add-rewrite-annotation"
                      >
                        {t('ingress_form.add_rewrite_annotation')}
                      </Button>
                    </span>
                  </TooltipWithChildren>

                  <TooltipWithChildren message={t('ingress_form.regex_annotation_tooltip')}>
                    <span>
                      <Button
                        className="btn btn-sm btn-light mb-2 ml-2"
                        onClick={() => addNewAnnotation('regex')}
                        icon={Plus}
                        data-cy="add-regex-annotation"
                      >
                        {t('ingress_form.add_regex_annotation')}
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
                  {t('ingress_form.add_ingress_class_annotation')}
                </Button>
              )}
            </div>

            <div className="col-sm-12 text-muted px-0">{t('ingress_form.rules')}</div>
          </div>
        )}

        {namespace &&
          rule?.Hosts?.map((host, hostIndex) => (
            <Card key={host.Key} className="mb-5">
              <div className="flex flex-col">
                <div className="row rule-actions">
                  <div className="col-sm-3 p-0">
                    {!host.NoHost ? t('ingress_form.rule') : t('ingress_form.fallback_rule')}
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
                      {t('ingress_form.remove_rule')}
                    </Button>
                  </div>
                </div>
                {!host.NoHost && (
                  <div className="row">
                    <div className="form-group col-sm-6 col-lg-4 !pl-0 !pr-2">
                      <InputGroup size="small">
                        <InputGroup.Addon
                          required
                          as="label"
                          htmlFor={`ingress_host_${hostIndex}`}
                        >
                          {t('ingress_form.hostname')}
                        </InputGroup.Addon>
                        <InputGroup.Input
                          name={`ingress_host_${hostIndex}`}
                          data-cy={`ingress-host_${hostIndex}`}
                          id={`ingress_host_${hostIndex}`}
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
                        <FormError className="!mb-0 mt-1">
                          {errors[`hosts[${hostIndex}].host`]}
                        </FormError>
                      )}
                    </div>

                    <div className="form-group col-sm-6 col-lg-4 !pl-2 !pr-0">
                      <InputGroup size="small">
                        <InputGroup.Addon
                          as="label"
                          htmlFor={`ingress_tls_${hostIndex}`}
                        >
                          {t('ingress_form.tls_secret')}
                        </InputGroup.Addon>
                        <Select
                          key={tlsOptions.toString() + host.Secret}
                          name={`ingress_tls_${hostIndex}`}
                          inputId={`ingress_tls_${hostIndex}`}
                          options={tlsOptions}
                          value={
                            host.Secret !== undefined
                              ? {
                                  value: host.Secret,
                                  label: host.Secret || t('ingress_form.no_tls'),
                                }
                              : null
                          }
                          onChange={(TLSOption) =>
                            handleTLSChange(hostIndex, TLSOption?.value || '')
                          }
                          placeholder={
                            tlsOptions.length
                              ? t('ingress_form.select_tls_secret')
                              : t('ingress_form.no_tls_secrets')
                          }
                          noOptionsMessage={() => t('ingress_form.no_tls_secrets')}
                          size="sm"
                          data-cy={`k8sAppCreate-tlsSelect_${hostIndex}`}
                          id={`k8sAppCreate-tlsSelect_${hostIndex}`}
                        />
                        {!host.NoHost && (
                          <div className="input-group-btn">
                            <Button
                              className="btn btn-light btn-sm !ml-0 !rounded-l-none"
                              onClick={() => reloadTLSCerts()}
                              icon={RefreshCw}
                              data-cy={`k8sAppCreate-tlsRefreshButton_${hostIndex}`}
                            />
                          </div>
                        )}
                      </InputGroup>
                    </div>

                    <div className="col-sm-12 col-lg-4 flex h-[30px] items-center pl-2">
                      <TextTip color="blue">
                        {t('ingress_form.create_secret_tip_prefix')}{' '}
                        <Link
                          to="kubernetes.secrets.new"
                          params={{ id: environmentID }}
                          className="text-primary"
                          target="_blank"
                          data-cy={`k8sAppCreate-createSecretLink_${hostIndex}`}
                        >
                          {t('ingress_form.create_secret_link')}
                        </Link>{' '}
                        {t('ingress_form.create_secret_tip_suffix')}
                      </TextTip>
                    </div>
                  </div>
                )}
                {host.NoHost && (
                  <TextTip color="blue">
                    {t('ingress_form.fallback_rule_description')}
                  </TextTip>
                )}

                <div className="row">
                  <div className="col-sm-12 text-muted !mb-0 mt-2 px-0">
                    {t('ingress_form.paths')}
                  </div>
                </div>

                {!host.Paths.length && (
                  <TextTip className="mt-2" color="blue">
                    {t('ingress_form.no_paths_tip')}
                  </TextTip>
                )}

                {host.Paths.map((path, pathIndex) => (
                  <div
                    className="row path !mb-5 mt-5"
                    key={`path_${path.Key}}`}
                  >
                    <div className="form-group col-sm-3 col-xl-2 !m-0 !pl-0">
                      <InputGroup size="small">
                        <InputGroup.Addon
                          required
                          as="label"
                          htmlFor={`ingress_service_${hostIndex}_${pathIndex}`}
                        >
                          Service
                        </InputGroup.Addon>
                        <Select
                          key={serviceOptions.toString() + path.ServiceName}
                          name={`ingress_service_${hostIndex}_${pathIndex}`}
                          id={`ingress_service_${hostIndex}_${pathIndex}`}
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
                              ? t('ingress_form.select_service')
                              : t('ingress_form.no_services')
                          }
                          noOptionsMessage={() => t('ingress_form.no_services')}
                          size="sm"
                          data-cy={`k8sAppCreate-serviceSelect_${hostIndex}_${pathIndex}`}
                        />
                      </InputGroup>
                      {errors[
                        `hosts[${hostIndex}].paths[${pathIndex}].servicename`
                      ] && (
                        <FormError className="error-inline !mb-0 mt-1">
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
                            <InputGroup.Addon
                              required
                              as="label"
                              htmlFor={`ingress_servicePort_${hostIndex}_${pathIndex}`}
                            >
                              {t('ingress_form.service_port')}
                            </InputGroup.Addon>
                            <Select
                              key={servicePorts.toString() + path.ServicePort}
                              name={`ingress_servicePort_${hostIndex}_${pathIndex}`}
                              id={`ingress_servicePort_${hostIndex}_${pathIndex}`}
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
                                  ? t('ingress_form.select_port')
                                  : t('ingress_form.no_ports')
                              }
                              noOptionsMessage={() => t('ingress_form.no_ports')}
                              size="sm"
                              data-cy={`k8sAppCreate-servicePortSelect_${hostIndex}_${pathIndex}`}
                            />
                          </InputGroup>
                          {errors[
                            `hosts[${hostIndex}].paths[${pathIndex}].serviceport`
                          ] && (
                            <FormError className="!mb-0 mt-1">
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
                        <InputGroup.Addon
                          as="label"
                          htmlFor={`ingress_pathType_${hostIndex}_${pathIndex}`}
                        >
                          {t('ingress_form.path_type')}
                        </InputGroup.Addon>
                        <Select
                          key={servicePorts.toString() + path.PathType}
                          name={`ingress_pathType_${hostIndex}_${pathIndex}`}
                          id={`ingress_pathType_${hostIndex}_${pathIndex}`}
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
                              ? t('ingress_form.select_path_type')
                              : t('ingress_form.no_path_types')
                          }
                          noOptionsMessage={() => t('ingress_form.no_path_types')}
                          size="sm"
                          data-cy={`k8sAppCreate-pathTypeSelect_${hostIndex}_${pathIndex}`}
                        />
                      </InputGroup>
                      {errors[
                        `hosts[${hostIndex}].paths[${pathIndex}].pathType`
                      ] && (
                        <FormError className="!mb-0 mt-1">
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
                        <InputGroup.Addon
                          required
                          as="label"
                          htmlFor={`ingress_route_${hostIndex}-${pathIndex}`}
                        >
                          {t('ingress_form.path')}
                        </InputGroup.Addon>
                        <InputGroup.Input
                          className="form-control"
                          name={`ingress_route_${hostIndex}-${pathIndex}`}
                          id={`ingress_route_${hostIndex}-${pathIndex}`}
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
                        <FormError className="!mb-0 mt-1">
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
                    data-cy={`k8sAppCreate-addPathButton_${hostIndex}`}
                  >
                    {t('ingress_form.add_path')}
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
                data-cy="k8sAppCreate-addHostButton"
              >
                {t('ingress_form.add_new_host')}
              </Button>

              <Button
                className="ml-2"
                type="button"
                onClick={() => addNewIngressHost(true)}
                disabled={hasNoHostRule}
                icon={Plus}
                data-cy="k8sAppCreate-addFallbackButton"
              >
                {t('ingress_form.add_fallback_rule')}
              </Button>
              <Tooltip message={t('ingress_form.fallback_rule_tooltip')} />
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
