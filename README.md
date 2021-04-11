# 自动生成API声明文件

根据接口自动生成ts声明文件

## 示例

### api.js

```js
export default {
  /**
   * 登录
   * @param {string} name 用户名
   * @param {string} pass 密码
   * @returns
   */
  login(name, pass) {
    return http({
      method: 'post',
      url: '/login',
      data: { name, pass }
    }, true)
  },
}
```

### api.d.ts

```js
export default interface api {
  /**
   * 登录
   * @param {string} name 用户名
   * @param {string} pass 密码
   * @returns
   */
  login(name: string, pass: string): Promise<Response>
}
```

## 使用

默认执行当前目录下的modules的所有js文件，每个js文件都会生成一个独立的d.ts文件。

参数的类型声明全部依赖注释结构

```js
  /**
   * 函数的使用说明
   * @param {参数的类型，默认是any} 参数名 针对参数的注释
   * @returns {返回值的类型，默认是Promise} 返回值注释
   */
```

### 编译

```sh
tsc
```

### 执行

```sh
node main.js
```

## 关于原函数的差分判断

针对每一个函数的注释、形参、形参类型、返回值、返回值类型，任意一个改变都会触发声明的更新
