/* @ngInject */
export function UserActivityService(FileSaver, UserActivity) {
  return { authLogs, saveAuthLogsAsCSV };

  function authLogs(offset, limit, sort, keyword, date, contexts, types) {
    return UserActivity.authLogs({ offset, limit, keyword, before: date.to, after: date.from, sortBy: sort.key, sortDesc: sort.desc, contexts, types }).$promise;
  }

  async function saveAuthLogsAsCSV(sort, keyword, date, contexts, types) {
    const response = await UserActivity.authLogsAsCSV({ keyword, before: date.to, after: date.from, sortBy: sort.key, sortDesc: sort.desc, limit: 2000, contexts, types });
    return FileSaver.saveAs(response.data, 'logs.csv');
  }
}
