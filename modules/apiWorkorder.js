import http, { cscHttp, download } from '@/utils/request';
import store from '../../store'
import tools from '@/utils/tools'
function getGraph(data) {
  const obj = typeof data === 'object' ? data : JSON.parse(data);
  if (obj.nodes) {
    return obj.nodes[0].input.fronts;
  } else {
    return obj;
  }
}

function integrationData(taskList) {
  const list = [...taskList];
  list.forEach(item => {
    const data = item.code === 'MANUAL_TASK' ? JSON.parse(item.graph) : JSON.parse(item.graph).nodes[0].input.fronts;
    item.templateConfig = data.templateConfig
    item.title = data.title;
  });
  for (let i = 0; i < list.length; i++) {
    if (list[i].parentInstanceId) {
      let parentTask = list.find(item1 => item1.id == list[i].parentInstanceId)
      if (parentTask) {
        if (!parentTask.children) parentTask.children = []
        parentTask.children.push(list[i])
        list.splice(i--, 1)
      }
    }
  }
  return list;
}

export default {
  /**
   * 前置任务与主任务绑定
   * @param {number} id 任务ID
   * @param {number} preId 主任务ID
   * @returns
   */
  bindPreTasks(id, preId) {
    return http({
      method: 'post',
      url: '/service/pre/config/create',
      data: {
        id, preId
      }
    }, true)
  },
  /* 添加默认告警通知人 */
  getDefaultUserAdds(data) {
    return http({
      url: '/alarmnoticerule/default/user/add',
      method: 'post',
      options: {
        noParam: true,
      },
      data: {
        params: JSON.stringify(data)
      }
    }, true).then(data => data)
  },
  /* test */
  getDefaultModifys(data) {
    return http({
      url: '/alarmnoticerule/default/user/add',
      method: 'post',
      options: {
        noParam: true,
      },
      data: {
        params: JSON.stringify(data)
      }
    }, true).then(data => data)
  },
}
