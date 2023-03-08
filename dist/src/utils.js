"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nope = exports.echo = exports.warn = exports.sortedKeys = exports.sortedEntries = exports.indentLines = exports.indent = exports.getFileDir = exports.getFullPath = exports.getFileName = exports.fileExists = exports.newEmptyComponent = exports.newEmptyState = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function newEmptyState(inputFilePath = "", propsFormat) {
    return {
        complexMap: {},
        componentsMap: {},
        enumsMap: {},
        importsMap: {},
        inputFilePath,
        propsFormat: propsFormat || '{Component}Props',
    };
}
exports.newEmptyState = newEmptyState;
function newEmptyComponent() {
    return {
        props: {},
        importsUsed: {},
    };
}
exports.newEmptyComponent = newEmptyComponent;
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
function getFullPath(filePath, relativePath) {
    return path_1.default.resolve(path_1.default.dirname(filePath), relativePath);
}
exports.getFullPath = getFullPath;
function getFileDir(filePath) {
    return filePath.replace(/^(.+)\/[^/]+$/, "$1/");
}
exports.getFileDir = getFileDir;
function indent(str, ct = 1) {
    const spaces = [...new Array(ct)].fill("  ").join("");
    return `${spaces}${str}`;
}
exports.indent = indent;
function indentLines(str, ct = 1) {
    return str.map(x => x.split("\n").map(x => indent(x, ct)).join(`\n`));
}
exports.indentLines = indentLines;
function sortedEntries(obj) {
    return [...Object.entries(obj)].sort(([a, _x], [b, _y]) => a.localeCompare(b));
}
exports.sortedEntries = sortedEntries;
function sortedKeys(obj) {
    return [...Object.keys(obj)].sort((a, b) => a.localeCompare(b));
}
exports.sortedKeys = sortedKeys;
function warn(msg) {
    console.log(msg);
}
exports.warn = warn;
function echo(msg) {
    console.log(msg);
}
exports.echo = echo;
function nope(errorStr = "") {
    if (errorStr)
        console.error(errorStr);
    process.exit(1);
}
exports.nope = nope;
//# sourceMappingURL=utils.js.map