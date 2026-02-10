import { describe, test, expect } from 'vitest';

import { EnvironmentType } from '@/react/portainer/environments/types';
import { createMockEnvironment } from '@/react-tools/test-mocks';

import { formatURL, buildInitialValues, buildUpdatePayload } from './helpers';

describe('formatURL', () => {
  test.each([
    {
      description: 'Docker environment with plain URL',
      url: '10.0.0.1:2375',
      environmentType: EnvironmentType.Docker,
      expected: 'tcp://10.0.0.1:2375',
    },
    {
      description: 'Docker environment with tcp:// protocol',
      url: 'tcp://10.0.0.1:2375',
      environmentType: EnvironmentType.Docker,
      expected: 'tcp://10.0.0.1:2375',
    },
    {
      description: 'Docker environment with https:// protocol',
      url: 'https://docker.example.com:2376',
      environmentType: EnvironmentType.Docker,
      expected: 'tcp://docker.example.com:2376',
    },
    {
      description: 'Docker environment with http:// protocol',
      url: 'http://docker.example.com:2375',
      environmentType: EnvironmentType.Docker,
      expected: 'tcp://docker.example.com:2375',
    },
    {
      description: 'Docker environment with unix:// socket',
      url: 'unix:///var/run/docker.sock',
      environmentType: EnvironmentType.Docker,
      expected: 'unix:///var/run/docker.sock',
    },
    {
      description: 'Agent on Docker',
      url: 'agent-host:9001',
      environmentType: EnvironmentType.AgentOnDocker,
      expected: 'tcp://agent-host:9001',
    },
    {
      description: 'Kubernetes Local with https://',
      url: 'https://k8s.example.com:6443',
      environmentType: EnvironmentType.KubernetesLocal,
      expected: 'https://k8s.example.com:6443',
    },
    {
      description: 'Kubernetes Local without protocol',
      url: 'k8s.example.com:6443',
      environmentType: EnvironmentType.KubernetesLocal,
      expected: 'https://k8s.example.com:6443',
    },
    {
      description: 'Agent on Kubernetes no protocol added',
      url: 'k8s-agent:9001',
      environmentType: EnvironmentType.AgentOnKubernetes,
      expected: 'k8s-agent:9001',
    },
    {
      description: 'Edge Agent on Docker',
      url: 'edge-agent:8000',
      environmentType: EnvironmentType.EdgeAgentOnDocker,
      expected: 'tcp://edge-agent:8000',
    },
    {
      description: 'Edge Agent on Kubernetes',
      url: 'edge-k8s:9001',
      environmentType: EnvironmentType.EdgeAgentOnKubernetes,
      expected: 'tcp://edge-k8s:9001',
    },
    {
      description: 'Empty URL',
      url: '',
      environmentType: EnvironmentType.Docker,
      expected: '',
    },
  ])('$description', ({ url, environmentType, expected }) => {
    const result = formatURL({ url, environmentType });
    expect(result).toBe(expected);
  });
});

describe('buildInitialValues', () => {
  test.each([
    {
      description: 'Docker with tcp:// URL',
      environment: {
        URL: 'tcp://10.0.0.1:2375',
        Type: EnvironmentType.Docker,
        TLSConfig: { TLS: true, TLSSkipVerify: false },
      },
      expectedUrl: '10.0.0.1:2375',
      expectedTls: {
        tls: true,
        skipVerify: false,
        caCertFile: undefined,
        certFile: undefined,
        keyFile: undefined,
      },
    },
    {
      description: 'Docker with unix:// socket',
      environment: {
        URL: 'unix:///var/run/docker.sock',
        Type: EnvironmentType.Docker,
      },
      expectedUrl: 'unix:///var/run/docker.sock',
      expectedTls: undefined,
    },
    {
      description: 'Kubernetes without TLS config',
      environment: {
        URL: 'https://k8s.example.com:6443',
        Type: EnvironmentType.AgentOnKubernetes,
      },
      expectedUrl: 'k8s.example.com:6443',
      expectedTls: undefined,
    },
    {
      description: 'Agent on Docker without TLS',
      environment: {
        URL: 'tcp://agent:9001',
        Type: EnvironmentType.AgentOnDocker,
      },
      expectedUrl: 'agent:9001',
      expectedTls: undefined,
    },
  ])('$description', ({ environment, expectedUrl, expectedTls }) => {
    const mockEnv = createMockEnvironment(environment);
    const result = buildInitialValues(mockEnv);

    expect(result.environmentUrl).toBe(expectedUrl);
    expect(result.tls).toEqual(expectedTls);
  });
});

describe('buildUpdatePayload', () => {
  test.each([
    {
      description: 'Docker environment with plain URL',
      values: {
        name: 'my-docker',
        environmentUrl: '10.0.0.1:2375',
        publicUrl: '1.2.3.4',
        meta: { groupId: 1, tagIds: [1, 2] },
        tls: {
          tls: true,
          skipVerify: false,
          caCertFile: undefined,
          certFile: undefined,
          keyFile: undefined,
        },
      },
      environmentType: EnvironmentType.Docker,
      expectedUrl: 'tcp://10.0.0.1:2375',
    },
    {
      description: 'Kubernetes Local environment',
      values: {
        name: 'my-k8s',
        environmentUrl: 'k8s.local:6443',
        publicUrl: '',
        meta: { groupId: 1, tagIds: [] },
        tls: undefined,
      },
      environmentType: EnvironmentType.KubernetesLocal,
      expectedUrl: 'https://k8s.local:6443',
    },
    {
      description: 'Agent on Kubernetes',
      values: {
        name: 'k8s-agent',
        environmentUrl: 'agent:9001',
        publicUrl: '',
        meta: { groupId: 2, tagIds: [] },
        tls: undefined,
      },
      environmentType: EnvironmentType.AgentOnKubernetes,
      expectedUrl: 'agent:9001',
    },
    {
      description: 'Local Docker (should return the same URL)',
      values: {
        name: 'local-docker',
        environmentUrl: 'unix:///var/run/docker.sock',
        publicUrl: '',
        meta: { groupId: 1, tagIds: [] },
        tls: undefined,
      },
      environmentType: EnvironmentType.Docker,
      expectedUrl: 'unix:///var/run/docker.sock',
    },
  ])('$description', ({ values, environmentType, expectedUrl }) => {
    const payload = buildUpdatePayload({
      values,
      environmentType,
    });

    expect(payload.URL).toBe(expectedUrl);
    expect(payload.Name).toBe(values.name);
    expect(payload.PublicURL).toBe(values.publicUrl);
    expect(payload.GroupID).toBe(values.meta.groupId);
    expect(payload.TagIds).toEqual(values.meta.tagIds);
  });
});
