#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = __importDefault(require("../main"));
const commander_1 = __importDefault(require("commander"));
commander_1.default
    .option('-d, --dir [p]', '项目所在的绝对路径（针对全局引入）', process.cwd())
    .option('-m, --module [p]', '需要生成声明文件的API文件所在目录（针对局部引入）', 'api/modules')
    .option('-a, --assign <p...>', '为指定API生成声明（基于dir，默认当前项目）')
    .option('-v, --verbose', '输出更新日志')
    .action((cmdObj) => {
    const { dir, module, assign, verbose } = cmdObj;
    main_1.default(dir, module, assign, verbose);
});
commander_1.default.parse(process.argv);
