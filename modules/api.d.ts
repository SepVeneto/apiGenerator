export default interface api {
  login(username: any, password: any): Promise<Response>;
}