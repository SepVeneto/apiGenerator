/**
 * 账号登录
 * @param {string} username 用户名
 * @param {string} password 登录密码
 * @returns
 */
export function login(username, password) {
  return http({
    method: 'post',
    url: '/login',
    data: { username, password }
  }, true)
}
