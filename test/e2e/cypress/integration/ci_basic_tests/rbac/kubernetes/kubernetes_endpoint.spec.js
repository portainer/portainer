import { rbacTests } from '../../../../support/rbacTestCases.js';
const platform = 'Kubernetes Cluster';
const environment = 'Endpoint';
const authType = 'Internal auth';
const testType = 'Basic';

rbacTests(platform, environment, authType, testType);
