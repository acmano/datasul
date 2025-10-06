// @ts-nocheck
export type ConnectionType = 'sqlserver' | 'odbc';
export interface ConnectionStatus {
  type: ConnectionType;
  mode: 'MOCK_DATA' | 'REAL_DATABASE';
  error?: string;
}
export interface QueryParameter {
  name: string;
  type: string;
  value: any;
}
export interface IConnection {
  connect(): Promise<void>;
  query(sql: string): Promise<any>;
  queryWithParams(sql: string, params: QueryParameter[]): Promise<any>;
  close(): Promise<void>;
  isConnected(): boolean;
}
export interface DatabaseConfig {
  server?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  dsn?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}