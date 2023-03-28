"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleImport = exports.createArgType = exports.mutableAddToImports = exports.mutableAddPropBinding = exports.handleFunction = exports.extractObjectEnumValues = exports.extractEnumValues = exports.getObjectEnumLiteral = exports.handleObjectEnum = exports.handleEnum = exports.importEnumsFromFile = exports.mutableAddPropsType = exports.handleInterface = exports.handleType = exports.getComponentNameFromProps = void 0;
const typescript_1 = __importDefault(require("typescript"));
const immer_1 = __importDefault(require("immer"));
const tsnode_1 = require("./tsnode");
const utils_1 = require("./utils");
function getComponentNameFromProps(format, propsName) {
    const reg = new RegExp("^" + format.replace("{Component}", "([A-Z][a-zA-Z0-9_]+)") + "$");
    const match = reg.exec(propsName);
    return (match === null || match === void 0 ? void 0 : match.length) && match[1];
}
exports.getComponentNameFromProps = getComponentNameFromProps;
function handleType(state, typeDeclaration) {
    return (0, immer_1.default)(state, draft => {
        var _a;
        const typeName = (0, tsnode_1.getName)(typeDeclaration);
        const componentName = getComponentNameFromProps(state.propsFormat, typeName);
        if (componentName) {
            const typeLiteral = (0, tsnode_1.getFirstOfKind)(typeDeclaration, typescript_1.default.SyntaxKind.TypeLiteral);
            (_a = typeLiteral === null || typeLiteral === void 0 ? void 0 : typeLiteral.members) === null || _a === void 0 ? void 0 : _a.forEach(propSig => {
                if (!typescript_1.default.isPropertySignature(propSig))
                    return;
                const propName = (0, tsnode_1.getName)(propSig);
                mutableAddPropsType(draft, componentName, propName, propSig.type, !!propSig.questionToken);
            });
            return draft;
        }
        else { // non-props type
            draft.complexMap[typeName] = (0, tsnode_1.generateDefaultObject)(typeDeclaration);
            draft.importsMap[typeName] = `./${(0, utils_1.getFileName)(draft.inputFilePath)}`;
        }
    });
}
exports.handleType = handleType;
function handleInterface(state, interfaceDeclaration) {
    return (0, immer_1.default)(state, draft => {
        const propsName = (0, tsnode_1.getName)(interfaceDeclaration);
        const componentName = getComponentNameFromProps(state.propsFormat, propsName);
        if (!componentName)
            return state;
        const propSigs = (0, tsnode_1.getChildrenOfKind)(interfaceDeclaration, [typescript_1.default.SyntaxKind.PropertySignature]);
        propSigs === null || propSigs === void 0 ? void 0 : propSigs.forEach((propSig) => {
            if (!typescript_1.default.isPropertySignature(propSig) || !typescript_1.default.isIdentifier(propSig.name))
                return;
            const propName = propSig.name.escapedText.toString();
            mutableAddPropsType(draft, componentName, propName, propSig.type, !!propSig.questionToken);
        });
        return draft;
    });
}
exports.handleInterface = handleInterface;
function mutableAddPropsType(draft, componentName, propName, typeNode, isOptional) {
    if (!draft.componentsMap[componentName]) {
        draft.componentsMap[componentName] = (0, utils_1.newEmptyComponent)();
    }
    // FIXME: when running tests, TypeError: Cannot read property 'text' of undefined
    let type = "";
    try {
        type = typeNode.getText();
    }
    catch (e) { }
    const set = (p) => {
        draft.componentsMap[componentName].props[propName] = Object.assign({ type, kind: typeNode.kind, name: propName, isOptional }, p);
    };
    if (propName === "children") {
        draft.componentsMap[componentName].hasChildren = true;
        return;
    }
    const { kind } = typeNode;
    // TODO: for optional args, use default value if present (prop.intializer)
    switch (kind) {
        case typescript_1.default.SyntaxKind.UnionType:
            if (!typescript_1.default.isUnionTypeNode(typeNode))
                return;
            if (typeNode.types.every(typescript_1.default.isLiteralTypeNode)) {
                const enumKeys = typeNode.types.map(t => t.getText());
                return set({
                    type: enumKeys.join(" | "),
                    argType: createArgType(enumKeys)
                });
            }
            else {
                // If union includes string or a number, we create those controls (in that order)
                if (typeNode.types.find(t => t.kind === typescript_1.default.SyntaxKind.StringKeyword)) {
                    return set({
                        kind: typescript_1.default.SyntaxKind.StringKeyword,
                        defaultValue: "''",
                    });
                }
                else if (typeNode.types.find(t => t.kind === typescript_1.default.SyntaxKind.NumberKeyword)) {
                    return set({
                        kind: typescript_1.default.SyntaxKind.NumberKeyword,
                        defaultValue: "0",
                    });
                }
            }
            break;
        case typescript_1.default.SyntaxKind.BooleanKeyword:
            return set({ type: "boolean", defaultValue: "false" });
        case typescript_1.default.SyntaxKind.StringKeyword:
            return set({ type: "string", defaultValue: "''" });
        case typescript_1.default.SyntaxKind.NumberKeyword:
            return set({ type: "number", defaultValue: "0" });
        case typescript_1.default.SyntaxKind.FunctionType:
            return set({ argType: { action: propName } });
        case typescript_1.default.SyntaxKind.IndexedAccessType:
            if (!typescript_1.default.isIndexedAccessTypeNode(typeNode))
                return;
            const objName = (0, tsnode_1.getIndexedAccessType)(typeNode);
            if (objName) {
                mutableAddToImports(draft, componentName, objName);
                return set({});
            }
            break;
        case typescript_1.default.SyntaxKind.ArrayType:
        case typescript_1.default.SyntaxKind.TypeReference:
            const node = typeNode.kind === typescript_1.default.SyntaxKind.ArrayType
                ? (0, tsnode_1.getFirstOfKind)(typeNode, typescript_1.default.SyntaxKind.TypeReference)
                : typeNode;
            if (!node || !typescript_1.default.isTypeReferenceNode(node))
                break;
            if ((0, tsnode_1.isJSX)(typeNode.getText())) {
                return set({ defaultValue: "<></>" });
            }
            const indexedType = (0, tsnode_1.getFirstOfKind)(node, typescript_1.default.SyntaxKind.IndexedAccessType);
            const typeName = (0, tsnode_1.getIndexedAccessType)(indexedType) || node.getText();
            if (!!draft.enumsMap[typeName]) {
                const enumKeys = Object.keys(draft.enumsMap[typeName]);
                mutableAddToImports(draft, componentName, typeName);
                return set({
                    argType: createArgType(enumKeys, typeName, "multi-select"),
                });
            }
            else if (draft.importsMap[typeName]) {
                mutableAddToImports(draft, componentName, typeName);
                if (draft.complexMap[typeName]) {
                    return set({
                        defaultValue: `${JSON.stringify(draft.complexMap[typeName])}`,
                    });
                }
                else {
                    // TODO: defaultValue / argType
                    const importPath = draft.importsMap[typeName];
                    draft.enumsMap = Object.assign(Object.assign({}, draft.enumsMap), importEnumsFromFile(draft.inputFilePath, importPath));
                }
            }
            return set({});
    }
}
exports.mutableAddPropsType = mutableAddPropsType;
function importEnumsFromFile(inputFilePath, relativeImportPath) {
    const fullImportPath = (0, utils_1.getFullPath)(inputFilePath, relativeImportPath);
    const sourceFile = (0, tsnode_1.getSourceFile)(fullImportPath);
    const addToEnumsMap = {};
    sourceFile === null || sourceFile === void 0 ? void 0 : sourceFile.statements.forEach(statement => {
        switch (statement.kind) {
            case typescript_1.default.SyntaxKind.VariableStatement:
                const objectEnum = getObjectEnumLiteral(statement);
                if (!objectEnum)
                    break;
                const [objName, objectLiteral] = objectEnum;
                const objectKVs = extractObjectEnumValues(objectLiteral);
                if (Object.keys(objectKVs).length >= 2) {
                    addToEnumsMap[objName] = objectKVs;
                }
                break;
            case typescript_1.default.SyntaxKind.EnumDeclaration:
                const enumName = (0, tsnode_1.getName)(statement);
                if (!typescript_1.default.isEnumDeclaration(statement))
                    break;
                addToEnumsMap[enumName] = extractEnumValues(statement);
                break;
        }
    });
    return addToEnumsMap;
}
exports.importEnumsFromFile = importEnumsFromFile;
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
    const varDeclaration = (0, tsnode_1.getFirstOfKind)(declarationList, typescript_1.default.SyntaxKind.VariableDeclaration);
    const asExpression = (0, tsnode_1.getFirstOfKind)(varDeclaration, typescript_1.default.SyntaxKind.AsExpression);
    let objectLiteral = (0, tsnode_1.getFirstOfKind)(asExpression || varDeclaration, typescript_1.default.SyntaxKind.ObjectLiteralExpression);
    if (!objectLiteral)
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
        const num = (0, tsnode_1.getFirstOfKind)(member, typescript_1.default.SyntaxKind.NumericLiteral);
        const str = (0, tsnode_1.getFirstOfKind)(member, typescript_1.default.SyntaxKind.StringLiteral);
        const valText = (num === null || num === void 0 ? void 0 : num.text) || (str === null || str === void 0 ? void 0 : str.text);
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
        const val = (0, tsnode_1.getNthOfKind)(oa, [
            typescript_1.default.SyntaxKind.NullKeyword,
            typescript_1.default.SyntaxKind.NumericLiteral,
            typescript_1.default.SyntaxKind.StringLiteral,
        ], 0);
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
    const fnName = (0, tsnode_1.getName)(fn) || (0, tsnode_1.getName)(fn.parent);
    if (!/^([A-Z][a-zA-Z0-9_]+)/.test(fnName))
        if (!state.componentsMap[fnName] && fnName !== (0, utils_1.getFileName)(state.inputFilePath))
            return state;
    return (0, immer_1.default)(state, draft => {
        var _a;
        draft.componentsMap[fnName] = Object.assign(Object.assign({}, (draft.componentsMap[fnName] || (0, utils_1.newEmptyComponent)())), { isDefaultExport: !!((_a = fn.modifiers) === null || _a === void 0 ? void 0 : _a.some(m => (m === null || m === void 0 ? void 0 : m.kind) === typescript_1.default.SyntaxKind.DefaultKeyword)), hasFunction: true });
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
function mutableAddPropBinding(draft, componentName, bind) {
    const propName = (0, tsnode_1.getName)(bind);
    bind.forEachChild(token => {
        var _a;
        const set = (val) => {
            if (draft.componentsMap[componentName].props[propName]) {
                draft.componentsMap[componentName].props[propName].defaultValue = `${val}`;
            }
        };
        if (bind.getChildCount() === 1) {
            const prop = draft.componentsMap[componentName].props[propName];
            if ((prop === null || prop === void 0 ? void 0 : prop.kind) === typescript_1.default.SyntaxKind.NumberKeyword)
                return set("0");
            else if ((prop === null || prop === void 0 ? void 0 : prop.kind) === typescript_1.default.SyntaxKind.StringKeyword)
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
                    mutableAddToImports(draft, componentName, enumName);
                    if (!((_a = draft.componentsMap[componentName].props[propName]) === null || _a === void 0 ? void 0 : _a.argType)) {
                        const enumKeys = Object.keys(draft.enumsMap[enumName]);
                        const argType = createArgType(enumKeys, enumName);
                        draft.componentsMap[componentName].props[propName] = Object.assign(Object.assign({}, draft.componentsMap[componentName].props[propName]), { argType });
                    }
                }
                return set(`${enumName}.${(0, tsnode_1.getName)(token, 1)}`);
        }
    });
}
exports.mutableAddPropBinding = mutableAddPropBinding;
function mutableAddToImports(draft, componentName, importName) {
    if (!draft.componentsMap[componentName].importsUsed[importName]) {
        const path = draft.importsMap[importName] || `./${(0, utils_1.getFileName)(draft.inputFilePath)}`;
        draft.componentsMap[componentName].importsUsed[importName] = path;
    }
}
exports.mutableAddToImports = mutableAddToImports;
function createArgType(enumKeys, prefix, controlType) {
    return ({
        control: {
            type: controlType || (enumKeys.length > 2 ? "select" : "radio")
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