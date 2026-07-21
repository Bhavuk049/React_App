// Maps a backend validation error response ({ error, issues: [{ path, message }] })
// into a { fieldName: message } object so forms can show errors under each field.
export function getFieldErrors(err) {
  const issues = err.data?.issues;
  if (!Array.isArray(issues)) return {};

  const fieldErrors = {};
  for (const issue of issues) {
    const field = issue.path?.[0];
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
