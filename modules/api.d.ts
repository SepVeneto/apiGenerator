export default interface api {
  /**
   * 账号登录
   * @param {string} username 用户名
   * @param {string} password 登录密码
   * @returns
   */
  login(username: string, password: string): Promise<Response>;
  /**
   * 获取工单详情
   * @param {object} data
   * @param {boolean} disabled 是否可编辑，默认false 可编辑
   * @returns
   */
  getDetail(data: object, disabled: boolean): Promise<Response>;
}