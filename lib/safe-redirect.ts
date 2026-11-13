export function getSafeRedirectPath(value?: string | string[]) {
  const path = Array.isArray(value) ? value[0] : value

  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return '/'
  }

  return path
}
