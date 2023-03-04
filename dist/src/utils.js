"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nope = exports.warn = exports.indentLines = exports.indent = exports.getFullPath = exports.getFileName = exports.fileExists = exports.newEmptyState = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function newEmptyState(inputFilePath = "", propsFormat) {
    return {
        componentsMap: {},
        enumsMap: {},
        importsMap: {},
        importsUsed: {},
        inputFilePath,
        propsFormat: propsFormat || '{Component}Props',
    };
}
exports.newEmptyState = newEmptyState;
// Utility funcs
function fileExists(filePath) {
    let exists = false;
    try {
        (0, fs_1.accessSync)(filePath);
        exists = true;
    }
    catch (_a) { }
    return exists;
}
exports.fileExists = fileExists;
function getFileName(filePath, withExtension = false) {
    const inputFileName = filePath.split("/").reverse()[0];
    if (withExtension)
        return inputFileName;
    return inputFileName.replace(/\.tsx?$/, '');
}
exports.getFileName = getFileName;
function getFullPath(inputFilePath, relativePath) {
    return path_1.default.resolve(path_1.default.dirname(inputFilePath), relativePath);
}
exports.getFullPath = getFullPath;
function indent(str, ct = 1) {
    const spaces = [...new Array(ct)].fill("  ").join("");
    return `${spaces}${str}`;
}
exports.indent = indent;
function indentLines(str, ct = 1) {
    return str.map(x => x.split("\n").map(x => indent(x, ct)).join(`\n`));
}
exports.indentLines = indentLines;
function warn(msg) {
    console.log(msg);
}
exports.warn = warn;
function nope(errorStr = "") {
    if (errorStr)
        console.error(errorStr);
    process.exit(1);
}
exports.nope = nope;
//# sourceMappingURL=utils.js.map