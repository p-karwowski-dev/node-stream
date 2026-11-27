export interface TokenStore {
  load(): string | null;
  save(token: string): void;
  clear(): void;
}
