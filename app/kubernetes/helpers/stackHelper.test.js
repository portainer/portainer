import KubernetesStackHelper from './stackHelper';

describe('stacksFromApplications', () => {
  const { stacksFromApplications } = KubernetesStackHelper;
  test('should return an empty array when passed an empty array', () => {
    expect(stacksFromApplications([])).toHaveLength(0);
  });

  test('should return an empty array when passed a list of applications without stacks', () => {
    expect(stacksFromApplications([{ StackName: '' }, { StackName: '' }, { StackName: '' }, { StackName: '' }])).toHaveLength(0);
  });
});
