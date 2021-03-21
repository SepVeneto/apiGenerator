import http, { cscHttp, download } from '@/utils/request';
import store from '../../store'
import tools from '@/utils/tools'

export default {
  /**
   * 绑定前置任务
   * @param {number} id 
   * @param {number} preId 
   * @returns { Promise }
   */
  bindPreTask(id, preId) {
    return http({
      method: 'post',
      url: '/service/pre/config/create',
      data: {
        id, preId
      }
    }, true)
  },
  /**
   * 创建前置任务
   * @param {number} id 
   * @param {number} preId 
   * @param {string} workNo 
   * @returns {Promise}
   */
  createPreTask(id, preId, workNo) {
    return http({
      method: 'post',
      url: '/instance/addPreTask',
      data: {
        id, preId, workNo
      }
    }, true)
  },
  /**
   * 获取工单详情
   * @param {string} workNo 
   * @param {string} type 
   * @param {string} needStatus 
   * @returns {Promise}
   */
  getWorkorderDetail(workNo, type, needStatus) {
    return cscHttp({
      method: 'post',
      url: '/instance/taskInstanceDetail',
      data: { workNo, type, needStatus },
    })
  },
}
