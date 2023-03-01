"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourceFile = exports.isExported = exports.findNodesOfKind = exports.traverse = exports.getName = exports.getFirstOfKind = exports.getNthOfKind = exports.getChildrenOfKind = void 0;
const typescript_1 = __importDefault(require("typescript"));
const fs_1 = require("fs");
const utils_1 = require("./utils");
function getChildrenOfKind(el, kinds) {
    let children = [];
    el === null || el === void 0 ? void 0 : el.forEachChild(child => {
        if (kinds.includes(child === null || child === void 0 ? void 0 : child.kind))
            children.push(child);
    });
    return children;
}
exports.getChildrenOfKind = getChildrenOfKind;
function getNthOfKind(el, kind, n) {
    return getChildrenOfKind(el, typeof kind === 'number' ? [kind] : kind)[n];
}
exports.getNthOfKind = getNthOfKind;
function getFirstOfKind(el, kind) {
    return getNthOfKind(el, typeof kind === 'number' ? [kind] : kind, 0);
}
exports.getFirstOfKind = getFirstOfKind;
function getName(el, n = 0) {
    const identifier = getNthOfKind(el, typescript_1.default.SyntaxKind.Identifier, n);
    if (!typescript_1.default.isIdentifier(identifier))
        return '';
    return identifier.escapedText || '';
}
exports.getName = getName;
function traverse(el, path) {
    const [next, ...remainder] = path;
    const nodes = getChildrenOfKind(el, [next[0]]);
    if (!nodes)
        return;
    if (remainder === null || remainder === void 0 ? void 0 : remainder.length)
        return traverse(nodes[next[1] || 0], remainder);
    return nodes;
}
exports.traverse = traverse;
function findNodesOfKind(originNode, kinds) {
    const foundNodes = [];
    function visit(node) {
        if (kinds.includes(node.kind)) {
            foundNodes.push(node);
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(originNode);
    return foundNodes;
}
exports.findNodesOfKind = findNodesOfKind;
function isExported(el) {
    var _a;
    return !!((_a = el.modifiers) === null || _a === void 0 ? void 0 : _a.some(m => (m === null || m === void 0 ? void 0 : m.kind) === typescript_1.default.SyntaxKind.ExportKeyword));
}
exports.isExported = isExported;
const sourceFileCache = {};
function getSourceFile(filePath) {
    if (!sourceFileCache[filePath]) {
        if (!/\.tsx?$/.test(filePath)) {
            if ((0, utils_1.fileExists)(`${filePath}.tsx`))
                return getSourceFile(`${filePath}.tsx`);
            else if ((0, utils_1.fileExists)(`${filePath}.ts`))
                return getSourceFile(`${filePath}.ts`);
            else
                return null;
        }
        sourceFileCache[filePath] = typescript_1.default.createSourceFile(filePath, (0, fs_1.readFileSync)(filePath).toString(), typescript_1.default.ScriptTarget.ESNext, true, // setParentNodes
        typescript_1.default.ScriptKind.TSX);
    }
    return sourceFileCache[filePath];
}
exports.getSourceFile = getSourceFile;
//# sourceMappingURL=tsnode.js.map