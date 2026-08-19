export const authenticationActivityTypesMap = {
  AuthSuccess: 1,
  AuthFailure: 2,
  Logout: 3,
};

export const authenticationActivityTypesLabels = {
  [authenticationActivityTypesMap.AuthSuccess]: 'Authentication success',
  [authenticationActivityTypesMap.AuthFailure]: 'Authentication failure',
  [authenticationActivityTypesMap.Logout]: 'Logout',
};
