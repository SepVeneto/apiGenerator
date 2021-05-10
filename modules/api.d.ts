export default interface Api {
  login(username: any, password: any): Promise<Response>;
}

export const api: Api;