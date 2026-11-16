// The user-facing text for each failure (docs/API.md, "Failures"). Components show these and
// never format errors themselves. A Record over ApiErrorKind: a new kind without a message
// fails the typecheck.
import type { ApiErrorKind } from './types';

const listFailed = "Couldn't load tasks. Check your connection.";
const addFailed = "Couldn't add the task. Try again.";

export const LIST_ERROR_MESSAGE: Record<ApiErrorKind, string> = {
  network: listFailed,
  timeout: listFailed,
  http: listFailed,
  shape: listFailed,
};

export const ADD_ERROR_MESSAGE: Record<ApiErrorKind, string> = {
  network: addFailed,
  timeout: addFailed,
  http: addFailed,
  shape: addFailed,
};
