#!/usr/bin/env node
import apiGenerate from '../main';
import commander from 'commander'

commander
  .option('-d, --dir [p]', '项目所在的绝对路径（针对全局引入）', process.cwd())
  .option('-m, --module [p]', '需要生成声明文件的API文件所在目录（针对局部引入）', 'api/modules')
  .option('-a, --assign <p...>', '为指定API生成声明（基于dir，默认当前项目）')
  .option('-v, --verbose', '输出更新日志')
  .action((cmdObj) => {
    const { dir, module, assign, verbose } = cmdObj;
    apiGenerate(dir, module, assign, verbose);
  })
commander.parse(process.argv)

