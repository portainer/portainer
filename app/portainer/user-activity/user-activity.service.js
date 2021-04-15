/* @ngInject */
export function UserActivityService(FileSaver, UserActivity) {
  return { authLogs, saveAuthLogsAsCSV, logs, saveLogsAsCSV };

  function authLogs(offset, limit, sort, keyword, date, contexts, types) {
    return UserActivity.authLogs({ offset, limit, keyword, before: date.to, after: date.from, sortBy: sort.key, sortDesc: sort.desc, contexts, types }).$promise;
  }

  async function saveAuthLogsAsCSV(sort, keyword, date, contexts, types) {
    const response = await UserActivity.authLogsAsCSV({ keyword, before: date.to, after: date.from, sortBy: sort.key, sortDesc: sort.desc, contexts, types });
    return FileSaver.saveAs(response.data, 'logs.csv');
  }

  function logs(offset, limit, sort, keyword, date) {
    return UserActivity.logs({ offset, limit, keyword, before: date.to, after: date.from, sortBy: sort.key, sortDesc: sort.desc }).$promise;
  }

  async function saveLogsAsCSV(sort, keyword, date) {
    const response = await UserActivity.logsAsCSV({ keyword, before: date.to, after: date.from, sortBy: sort.key, sortDesc: sort.desc });
    return FileSaver.saveAs(response.data, 'logs.csv');
  }
}
