export const getOdbcConnectionString = (database: 'EMP' | 'MULT'): string => {
  const dsnName =
    database === 'EMP'
      ? process.env.ODBC_DSN_EMP || 'PRD_EMS2EMP'
      : process.env.ODBC_DSN_MULT || 'PRD_EMS2MULT';

  const user = process.env.ODBC_USER || process.env.DB_USER || '';
  const password = process.env.ODBC_PASSWORD || process.env.DB_PASSWORD || '';

  return `DSN=${dsnName};UID=${user};PWD=${password}`;
};