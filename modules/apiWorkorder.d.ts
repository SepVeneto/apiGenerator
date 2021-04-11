export default interface apiWorkorder {
  /**
   * 前置任务与主任务绑定
   * @param {number} id 任务ID
   * @param {number} preId 主任务ID
   * @returns
   */
  bindPreTasks(id: number, preId: number): Promise<Response>;
  /* 添加默认告警通知人 */
  getDefaultUserAdds(data: any): Promise<Response>;
  /* test */
  getDefaultModifys(data: any): Promise<Response>;
}