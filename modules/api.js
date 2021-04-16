export default {
  /**
   * 账号登录
   * @param {string} username 用户名
   * @param {string} password 登录密码
   * @returns
   */
  @ApiCache
  login(username, password) {
    return http({
      method: 'post',
      url: '/login',
      data: { username, password }
    }, true)
  },
}
