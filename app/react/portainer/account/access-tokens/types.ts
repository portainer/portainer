/**
 * AccessToken represents an API key
 */
export interface AccessToken {
  id: number;

  userId: number;

  description: string;

  /** API key identifier (7 char prefix) */
  prefix: string;

  /** Unix timestamp (UTC) when the API key was created */
  dateCreated: number;

  /** Unix timestamp (UTC) when the API key was last used */
  lastUsed: number;

  /** Digest represents SHA256 hash of the raw API key */
  digest?: string;
}
