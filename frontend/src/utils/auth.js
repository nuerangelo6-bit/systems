

export function getUser() {
  try {
    const u = localStorage.getItem('gms_user')
    return u ? JSON.parse(u) : null
  } catch { return null }
}

export function setUser(user) {
  localStorage.setItem('gms_user', JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem('gms_user')
}

export function logout() {
  clearUser()
  localStorage.removeItem('gms_token')
}

export function isSuperAdmin() {
  return getUser()?.role === 'superadmin'
}

export function isAdmin() {
  const r = getUser()?.role
  return r === 'admin' || r === 'superadmin'
}

export function isStudent() {
  return getUser()?.role === 'student'
}

export function authHeaders() {
  const u = getUser()
  if (!u || !u.token) return {}
  return { Authorization: `Bearer ${u.token}` }
}

export function setupAxiosAuth(axiosInstance) {
  axiosInstance.interceptors.request.use(config => {
    const headers = authHeaders()
    if (headers.Authorization) {
      config.headers = { ...config.headers, ...headers }
    }
    return config
  })
}
