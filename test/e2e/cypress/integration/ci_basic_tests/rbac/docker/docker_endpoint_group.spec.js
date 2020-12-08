import { rbacTests } from '../../../../support/rbacTestCases.js';
const platform = 'Docker Swarm';
const environment = 'Endpoint Group';
const authType = 'Internal auth';
const testType = 'Basic';

rbacTests(platform, environment, authType, testType);
