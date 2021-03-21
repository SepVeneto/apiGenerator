import { Response, ListRes, ListReq } from "../index";
import { RepClasses } from "./apiDuty";

interface ResWorderorderCount {
  /**
           * 待执行
           */
  TOEXCUTED: number;
  /**
           * 待复核
           */
  TOREVIEW: number;
  /**
           * 待审批
           */
  TOAUDIT: number;
  /**
           * 待需求确认
           */
  SUBMIT: number;
  /**
           * 已审批
           */
  AUDITED: number;
  /**
           * 已完成
           */
  FINISHED: number;
  /**
           * 待完成确认
           */
  TOFINISHCONFIRM: number;
}

interface WorkorderListReq extends ListReq {
  /**
           * 工单状态
           * DAIBAN: 待办 JINGBAN: 经办 MYORDER: 我的工单 APPROVING: 我的申请 DSUBMIT: 草稿
           */
  type: string;
}

interface WorkorderDetailReq {
  workNo: string;
  type?: string;
  needStatus: string;
}

export default interface apiWorkorder {
  /**
   * 绑定前置任务
   * @param {number} id 
   * @param {number} preId 
   * @returns { Promise }
   */
  bindPreTask(id: number, preId: number): Promise<Response>;
  /**
   * 创建前置任务
   * @param {number} id 
   * @param {number} preId 
   * @param {string} workNo 
   * @returns {Promise}
   */
  createPreTask(id: number, preId: number, workNo: string): Promise<Response>;
  getWorkorderDetail(data: object): Promise<Response<WorkorderDetailReq>>;
}