import { EnvironmentType } from '@/react/portainer/environments/types';

import { EditorType } from './types';
import { getValidEditorTypes } from './utils';

interface GetValidEditorTypesTest {
  endpointTypes: EnvironmentType[];
  expected: EditorType[];
  title: string;
}

describe('getValidEditorTypes', () => {
  const tests: GetValidEditorTypesTest[] = [
    {
      endpointTypes: [EnvironmentType.EdgeAgentOnDocker],
      expected: [EditorType.Compose],
      title: 'should return compose for docker envs',
    },
    {
      endpointTypes: [EnvironmentType.EdgeAgentOnKubernetes],
      expected: [EditorType.Kubernetes],
      title: 'should return kubernetes for kubernetes envs',
    },
    {
      endpointTypes: [
        EnvironmentType.EdgeAgentOnDocker,
        EnvironmentType.EdgeAgentOnKubernetes,
      ],
      expected: [],
      title: 'should return empty for docker and kubernetes envs',
    },
  ];

  tests.forEach((test) => {
    // eslint-disable-next-line vitest/valid-title
    it(test.title, () => {
      expect(getValidEditorTypes(test.endpointTypes)).toEqual(test.expected);
    });
  });
});
