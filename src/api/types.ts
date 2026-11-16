// docs/API.md. The response shape and the one error type every caller handles (D4).
export type Todo = { userId: number; id: number; title: string; completed: boolean };

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'shape';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}
