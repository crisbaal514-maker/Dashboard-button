/**
 * ConfigProvider — Interface for configuration sources.
 * Implementations: EnvProvider (.env), YamlProvider (future), VaultProvider (future).
 */
export interface ConfigProvider {
  get<T = string>(key: string, defaultValue?: T): T;
  getNumber(key: string, defaultValue?: number): number;
  getBoolean(key: string, defaultValue?: boolean): boolean;
  has(key: string): boolean;
}
