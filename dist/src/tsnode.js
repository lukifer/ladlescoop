"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDefaultObjectFromInterface = exports.generateDefaultObject = exports.getSourceFile = exports.typedTsNode = exports.isExported = exports.getIndexedAccessType = exports.findNodesOfKind = exports.traverse = exports.getName = exports.getFirstOfKind = exports.getNthOfKind = exports.getChildrenOfKind = void 0;
const typescript_1 = __importDefault(require("typescript"));
const fs_1 = require("fs");
const utils_1 = require("./utils");
const keysToTypeGuards = {
    [typescript_1.default.SyntaxKind.AsExpression]: typescript_1.default.isAsExpression,
    [typescript_1.default.SyntaxKind.EnumDeclaration]: typescript_1.default.isEnumDeclaration,
    [typescript_1.default.SyntaxKind.Identifier]: typescript_1.default.isIdentifier,
    [typescript_1.default.SyntaxKind.IndexedAccessType]: typescript_1.default.isIndexedAccessTypeNode,
    [typescript_1.default.SyntaxKind.LiteralType]: typescript_1.default.isLiteralTypeNode,
    [typescript_1.default.SyntaxKind.NullKeyword]: (x) => x.kind === 104,
    [typescript_1.default.SyntaxKind.NumericLiteral]: typescript_1.default.isNumericLiteral,
    [typescript_1.default.SyntaxKind.ObjectBindingPattern]: typescript_1.default.isObjectBindingPattern,
    [typescript_1.default.SyntaxKind.ObjectLiteralExpression]: typescript_1.default.isObjectLiteralExpression,
    [typescript_1.default.SyntaxKind.Parameter]: typescript_1.default.isParameter,
    [typescript_1.default.SyntaxKind.PropertySignature]: typescript_1.default.isPropertySignature,
    [typescript_1.default.SyntaxKind.StringLiteral]: typescript_1.default.isStringLiteral,
    [typescript_1.default.SyntaxKind.TypeLiteral]: typescript_1.default.isTypeLiteralNode,
    [typescript_1.default.SyntaxKind.TypeOperator]: typescript_1.default.isTypeOperatorNode,
    [typescript_1.default.SyntaxKind.TypeQuery]: typescript_1.default.isTypeQueryNode,
    [typescript_1.default.SyntaxKind.TypeReference]: typescript_1.default.isTypeReferenceNode,
    [typescript_1.default.SyntaxKind.UnionType]: typescript_1.default.isUnionTypeNode,
    [typescript_1.default.SyntaxKind.VariableDeclaration]: typescript_1.default.isVariableDeclaration,
    [typescript_1.default.SyntaxKind.VariableDeclarationList]: typescript_1.default.isVariableDeclarationList,
};
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
    const nth = getChildrenOfKind(el, typeof kind === 'number' ? [kind] : kind)[n];
    if (typeof kind !== 'number')
        return nth;
    return nth && typedTsNode(nth, kind);
}
exports.getNthOfKind = getNthOfKind;
function getFirstOfKind(el, kind) {
    const first = getNthOfKind(el, kind, 0);
    return first && typedTsNode(first, kind);
}
exports.getFirstOfKind = getFirstOfKind;
function getName(el, n = 0) {
    const identifier = getNthOfKind(el, typescript_1.default.SyntaxKind.Identifier, n);
    if (!identifier || !typescript_1.default.isIdentifier(identifier))
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
function getIndexedAccessType(indexedType) {
    const query = getFirstOfKind(indexedType, typescript_1.default.SyntaxKind.TypeQuery);
    const operator = getFirstOfKind(indexedType, typescript_1.default.SyntaxKind.TypeOperator);
    if (query && operator && query.getText() === operator.type.getText()) {
        return query.exprName.getText();
    }
    return null;
}
exports.getIndexedAccessType = getIndexedAccessType;
function isExported(node) {
    var _a;
    return !!((_a = node.modifiers) === null || _a === void 0 ? void 0 : _a.some(m => (m === null || m === void 0 ? void 0 : m.kind) === typescript_1.default.SyntaxKind.ExportKeyword));
}
exports.isExported = isExported;
function typedTsNode(val, key) {
    const typeGuard = keysToTypeGuards[key];
    if (!val)
        console.log({ key });
    if (typeGuard && typeGuard(val)) {
        return val;
    }
    else {
        return null;
        // throw new Error(`Value does not match type guard for key "${key}"`)
    }
}
exports.typedTsNode = typedTsNode;
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
function generateDefaultObject(node) {
    const typeNode = node.type;
    switch (typeNode.kind) {
        case typescript_1.default.SyntaxKind.StringKeyword:
            return "";
        case typescript_1.default.SyntaxKind.NumberKeyword:
            return 0;
        case typescript_1.default.SyntaxKind.ArrayType:
            return [];
        case typescript_1.default.SyntaxKind.TypeReference:
            return getName(typeNode) === 'Array' ? [] : undefined;
        // case ts.SyntaxKind.FunctionType:
        //   return () => {}
        case typescript_1.default.SyntaxKind.TypeLiteral:
            if (!typescript_1.default.isTypeLiteralNode(typeNode))
                return undefined;
            return typeNode.members.reduce((obj, propSig) => {
                const val = generateDefaultObject(propSig);
                if (val === undefined)
                    return obj;
                return Object.assign(Object.assign({}, obj), { [propSig.name.getText()]: val });
            }, {});
        // default:
        // throw new Error(`Unsupported type kind: ${ts.SyntaxKind[typeNode.kind]}`)
    }
}
exports.generateDefaultObject = generateDefaultObject;
function generateDefaultObjectFromInterface(interfaceDecl) {
    const obj = {};
    interfaceDecl.members.forEach(member => {
        if (typescript_1.default.isPropertySignature(member)) {
            const propName = member.name.getText();
            const propType = member.type;
            if (typescript_1.default.isTypeAliasDeclaration(propType)) {
                obj[propName] = generateDefaultObject(propType);
            }
        }
    });
    return obj;
}
exports.generateDefaultObjectFromInterface = generateDefaultObjectFromInterface;
//# sourceMappingURL=tsnode.js.map