export default interface api {
  /**
   * 账号登录
   * @param {string} username 用户名
   * @param {string} password 登录密码
   * @returns
   */
  login(username: string, password: string): Promise<Response>;
}