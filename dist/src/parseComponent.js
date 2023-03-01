"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImport = exports.createArgType = exports.mutableAddPropBinding = exports.handleFunction = exports.extractObjectEnumValues = exports.extractEnumValues = exports.getObjectEnumLiteral = exports.handleObjectEnum = exports.handleEnum = exports.mutableAddProp = exports.handleInterface = exports.handleType = exports.getFnFromProps = void 0;
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const immer_1 = __importDefault(require("immer"));
const tsnode_1 = require("./tsnode");
const utils_1 = require("./utils");
function getFnFromProps(format, propsName) {
    const reg = new RegExp("^" + format.replace("{Component}", "([A-Z][a-zA-Z0-9_]+)") + "$");
    const match = reg.exec(propsName);
    return (match === null || match === void 0 ? void 0 : match.length) && match[1];
}
exports.getFnFromProps = getFnFromProps;
function handleType(state, typeDeclaration) {
    return (0, immer_1.default)(state, draft => {
        const propsName = (0, tsnode_1.getName)(typeDeclaration);
        const fnName = getFnFromProps(state.propsFormat, propsName);
        if (!fnName)
            return state;
        const typeLiteral = (0, tsnode_1.getFirstOfKind)(typeDeclaration, typescript_1.default.SyntaxKind.TypeLiteral);
        if (!typeLiteral || !typescript_1.default.isTypeLiteralNode(typeLiteral))
            return state;
        typeLiteral.members.forEach(prop => {
            mutableAddProp(draft, fnName, prop);
        });
        return draft;
    });
}
exports.handleType = handleType;
function handleInterface(state, interfaceDeclaration) {
    return (0, immer_1.default)(state, draft => {
        const propsName = (0, tsnode_1.getName)(interfaceDeclaration);
        const fnName = getFnFromProps(state.propsFormat, propsName);
        if (!fnName)
            return state;
        const props = (0, tsnode_1.getChildrenOfKind)(interfaceDeclaration, [typescript_1.default.SyntaxKind.PropertySignature]);
        props === null || props === void 0 ? void 0 : props.forEach((prop) => {
            mutableAddProp(draft, fnName, prop);
        });
        return draft;
    });
}
exports.handleInterface = handleInterface;
function mutableAddProp(draft, fnName, prop) {
    if (!typescript_1.default.isPropertySignature(prop)
        || !typescript_1.default.isIdentifier(prop.name)
        || !typescript_1.default.isTypeNode(prop.type))
        return;
    const propName = prop.name.escapedText.toString();
    if (!draft.componentsMap[fnName]) {
        draft.componentsMap[fnName] = { props: {} };
    }
    const set = (p) => {
        draft.componentsMap[fnName].props[propName] = Object.assign(Object.assign({}, p), { name: propName, isOptional: !!prop.questionToken });
    };
    const typeNode = prop.type;
    const { kind } = typeNode;
    switch (kind) {
        case typescript_1.default.SyntaxKind.UnionType:
            if (!typescript_1.default.isUnionTypeNode(typeNode))
                return;
            if (typeNode.types.every(typescript_1.default.isLiteralTypeNode)) {
                const enumKeys = typeNode.types.map(t => t.getText());
                return set({
                    kind,
                    type: enumKeys.join(" | "),
                    argType: createArgType(enumKeys)
                });
            }
            else {
                // If union includes number or a string, we create those controls (in that order)
                const numType = typeNode.types.find(t => t.kind === typescript_1.default.SyntaxKind.NumberKeyword);
                const strType = typeNode.types.find(t => t.kind === typescript_1.default.SyntaxKind.StringKeyword);
                if (numType || strType) {
                    return set({
                        kind: numType
                            ? typescript_1.default.SyntaxKind.NumberKeyword
                            : typescript_1.default.SyntaxKind.StringKeyword,
                        type: typeNode.getText(),
                    });
                }
            }
            break;
        case typescript_1.default.SyntaxKind.BooleanKeyword:
            return set({ kind, type: "boolean" });
        case typescript_1.default.SyntaxKind.StringKeyword:
            return set({ kind, type: "string" });
        case typescript_1.default.SyntaxKind.NumberKeyword:
            return set({ kind, type: "number" });
        case typescript_1.default.SyntaxKind.TypeReference:
            if (!typescript_1.default.isTypeReferenceNode)
                return;
            const enumName = typeNode.getText();
            const propSet = { kind, type: enumName };
            if (draft.enumsMap[enumName]) {
                const enumKeys = Object.keys(draft.enumsMap[enumName]);
                return set(Object.assign(Object.assign({}, propSet), { argType: createArgType(enumKeys, enumName) }));
            }
            else if (draft.importsMap[enumName]) {
                const fullImportPath = path_1.default.resolve(path_1.default.dirname(draft.inputFilePath), draft.importsMap[enumName]);
                const sourceFile = (0, tsnode_1.getSourceFile)(fullImportPath);
                sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.statements.forEach(statement => {
                    switch (statement.kind) {
                        case typescript_1.default.SyntaxKind.VariableStatement:
                            const objectEnum = getObjectEnumLiteral(statement);
                            if (!objectEnum)
                                break;
                            const [objName, objectLiteral] = objectEnum;
                            const objectKVs = extractObjectEnumValues(objectLiteral);
                            if (Object.keys(objectKVs).length >= 2) {
                                draft.enumsMap[objName] = objectKVs;
                            }
                            break;
                        case typescript_1.default.SyntaxKind.EnumDeclaration:
                            const enumName = (0, tsnode_1.getName)(statement);
                            if (!draft.enumsMap[enumName] && typescript_1.default.isEnumDeclaration(statement)) {
                                draft.enumsMap[enumName] = extractEnumValues(statement);
                            }
                            break;
                    }
                });
            }
            return set(propSet);
    }
}
exports.mutableAddProp = mutableAddProp;
function handleEnum(state, enumDec) {
    if (!(0, tsnode_1.isExported)(enumDec))
        return state;
    return (0, immer_1.default)(state, draft => {
        const enumName = (0, tsnode_1.getName)(enumDec);
        draft.enumsMap[enumName] = extractEnumValues(enumDec);
        return draft;
    });
}
exports.handleEnum = handleEnum;
function handleObjectEnum(state, maybeObjectEnum) {
    if (!(0, tsnode_1.isExported)(maybeObjectEnum))
        return state;
    const objectEnum = getObjectEnumLiteral(maybeObjectEnum);
    if (!objectEnum)
        return state;
    const [objName, objectLiteral] = objectEnum;
    const objectKVs = extractObjectEnumValues(objectLiteral);
    if (Object.keys(objectKVs).length < 2)
        return state;
    return (0, immer_1.default)(state, draft => {
        draft.enumsMap[objName] = objectKVs;
        return draft;
    });
}
exports.handleObjectEnum = handleObjectEnum;
function getObjectEnumLiteral(maybeObjectEnum) {
    const declarationList = (0, tsnode_1.getFirstOfKind)(maybeObjectEnum, typescript_1.default.SyntaxKind.VariableDeclarationList);
    if (!typescript_1.default.isVariableDeclarationList(declarationList))
        return null;
    const varDeclaration = (0, tsnode_1.getFirstOfKind)(declarationList, typescript_1.default.SyntaxKind.VariableDeclaration);
    if (!typescript_1.default.isVariableDeclaration(varDeclaration))
        return null;
    let objectLiteral = (0, tsnode_1.getFirstOfKind)(varDeclaration, [
        typescript_1.default.SyntaxKind.AsExpression,
        typescript_1.default.SyntaxKind.ObjectLiteralExpression,
    ]);
    if (!objectLiteral)
        return null;
    if (!typescript_1.default.isObjectLiteralExpression(objectLiteral)) { // TODO: validate "as const"?
        objectLiteral = (0, tsnode_1.getFirstOfKind)(objectLiteral, typescript_1.default.SyntaxKind.ObjectLiteralExpression);
    }
    if (!objectLiteral || !typescript_1.default.isObjectLiteralExpression(objectLiteral))
        return null;
    return [(0, tsnode_1.getName)(varDeclaration), objectLiteral];
}
exports.getObjectEnumLiteral = getObjectEnumLiteral;
function extractEnumValues(enumDec) {
    const enumMembers = (0, tsnode_1.getChildrenOfKind)(enumDec, [typescript_1.default.SyntaxKind.EnumMember]).filter(typescript_1.default.isEnumMember);
    return enumMembers.reduce((rec, member) => {
        const memberName = typescript_1.default.isIdentifier(member.name)
            ? member.name.escapedText.toString()
            : "";
        if (!memberName)
            return rec;
        const literal = (0, tsnode_1.getFirstOfKind)(member, [
            typescript_1.default.SyntaxKind.NumericLiteral,
            typescript_1.default.SyntaxKind.StringLiteral,
        ]);
        const valText = literal && (typescript_1.default.isNumericLiteral(literal) || typescript_1.default.isStringLiteral(literal)) && literal.text;
        return Object.assign(Object.assign({}, rec), { [memberName]: valText });
    }, {});
}
exports.extractEnumValues = extractEnumValues;
function extractObjectEnumValues(objectLiteral) {
    const objectAssignments = (0, tsnode_1.getChildrenOfKind)(objectLiteral, [
        typescript_1.default.SyntaxKind.PropertyAssignment,
    ]).filter(typescript_1.default.isPropertyAssignment);
    return objectAssignments.reduce((kvs, oa) => {
        const key = (0, tsnode_1.getName)(oa);
        const val = (0, tsnode_1.getFirstOfKind)(oa, [
            typescript_1.default.SyntaxKind.NullKeyword,
            typescript_1.default.SyntaxKind.NumericLiteral,
            typescript_1.default.SyntaxKind.StringLiteral,
        ]);
        if (!val)
            return kvs;
        // TODO FIXME: this throws undefined on the extractObjectEnumValues test
        // let text = val.getText()
        // let text = getName(val)
        let text = val.text;
        try {
            if (typeof text === "string")
                text = JSON.parse(text);
        }
        catch (e) { }
        return (Object.assign(Object.assign({}, kvs), { [key]: text }));
    }, {});
}
exports.extractObjectEnumValues = extractObjectEnumValues;
function handleFunction(state, fn) {
    const fnName = (0, tsnode_1.getName)(fn);
    if (!/^([A-Z][a-zA-Z0-9_]+)/.test(fnName) || !state.componentsMap[fnName])
        return state;
    return (0, immer_1.default)(state, draft => {
        var _a;
        if (!(0, tsnode_1.isExported)(fn))
            (0, utils_1.warn)(`Warning: Component ${fnName} is not exported`);
        draft.componentsMap[fnName].isDefaultExport = !!((_a = fn.modifiers) === null || _a === void 0 ? void 0 : _a.some(typescript_1.default.isDefaultClause));
        const propsParam = (0, tsnode_1.getFirstOfKind)(fn, typescript_1.default.SyntaxKind.Parameter);
        const objectBinding = (0, tsnode_1.getFirstOfKind)(propsParam, typescript_1.default.SyntaxKind.ObjectBindingPattern);
        (0, tsnode_1.getChildrenOfKind)(objectBinding, [typescript_1.default.SyntaxKind.BindingElement]).forEach((bind) => {
            if (!typescript_1.default.isBindingElement(bind))
                return false;
            mutableAddPropBinding(draft, fnName, bind);
        });
        return draft;
    });
}
exports.handleFunction = handleFunction;
function mutableAddPropBinding(draft, fnName, bind) {
    const propName = (0, tsnode_1.getName)(bind);
    bind.forEachChild(token => {
        const set = (val) => {
            if (draft.componentsMap[fnName].props[propName]) {
                draft.componentsMap[fnName].props[propName].defaultValue = `${val}`;
            }
        };
        if (bind.getChildCount() === 1) {
            const prop = draft.componentsMap[fnName].props[propName];
            if (prop.kind === typescript_1.default.SyntaxKind.NumberKeyword)
                return set("0");
            else if (prop.kind === typescript_1.default.SyntaxKind.StringKeyword)
                return set("''");
        }
        switch (token.kind) {
            case typescript_1.default.SyntaxKind.NumericLiteral:
                return set(parseInt(token.getText()));
            case typescript_1.default.SyntaxKind.TypeReference:
            case typescript_1.default.SyntaxKind.UnionType:
            case typescript_1.default.SyntaxKind.StringLiteral:
                return set(token.getText());
            case typescript_1.default.SyntaxKind.NullKeyword:
                return set(null);
            case typescript_1.default.SyntaxKind.TrueKeyword:
                return set(true);
            case typescript_1.default.SyntaxKind.FalseKeyword:
                return set(false);
            case typescript_1.default.SyntaxKind.PropertyAccessExpression:
                if (!typescript_1.default.isPropertyAccessExpression(token))
                    return;
                const enumName = (0, tsnode_1.getName)(token);
                if (draft.enumsMap[enumName]) {
                    if (!draft.importsUsed[enumName]) {
                        const path = draft.importsMap[enumName] || `./${fnName}`;
                        draft.importsUsed[enumName] = path;
                    }
                    if (!draft.componentsMap[fnName].props[propName].argType) {
                        const enumKeys = Object.keys(draft.enumsMap[enumName]);
                        draft.componentsMap[fnName].props[propName].argType = createArgType(enumKeys, enumName);
                    }
                }
                return set(`${enumName}.${(0, tsnode_1.getName)(token, 1)}`);
        }
    });
}
exports.mutableAddPropBinding = mutableAddPropBinding;
function createArgType(enumKeys, prefix) {
    return ({
        control: {
            type: enumKeys.length > 2 ? "select" : "radio"
        },
        options: prefix
            ? enumKeys.map(k => `${prefix}.${k}`)
            : enumKeys,
    });
}
exports.createArgType = createArgType;
function handleImport(state, importDeclaration) {
    const namedImports = (0, tsnode_1.traverse)(importDeclaration, [
        [typescript_1.default.SyntaxKind.ImportClause, 0],
        [typescript_1.default.SyntaxKind.NamedImports, 0],
        [typescript_1.default.SyntaxKind.ImportSpecifier],
    ]);
    const importPath = (0, tsnode_1.getFirstOfKind)(importDeclaration, typescript_1.default.SyntaxKind.StringLiteral);
    return (0, immer_1.default)(state, draft => {
        namedImports === null || namedImports === void 0 ? void 0 : namedImports.forEach(namedImport => {
            const importName = (0, tsnode_1.getName)(namedImport);
            draft.importsMap[importName] = importPath.getText().slice(1, -1);
        });
        return draft;
    });
}
exports.handleImport = handleImport;
//# sourceMappingURL=parseComponent.js.map