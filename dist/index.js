"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const commander_1 = require("commander");
const ts = __importStar(require("typescript"));
const fs_1 = require("fs");
const storyTemplate_1 = require("./src/storyTemplate");
const parseComponent_1 = require("./src/parseComponent");
const tsnode_1 = require("./src/tsnode");
const utils_1 = require("./src/utils");
function run() {
    const program = new commander_1.Command();
    program.option("-o, --overwrite", "overwrite existing file");
    program.option("--propsformat <value>", "Custom props naming format, such as '{Component}PropType'");
    program.option("--wrap <value>", "Custom DOM wrapping: 'div(className=\"foo\"|id=\"bar\"),MyProvider(props={}),MockProvider(mocks=[])'");
    program.parse(process.argv);
    const inputFilePath = program.args[0];
    if (!inputFilePath) {
        (0, utils_1.nope)("Error: missing file path argument");
    }
    if (!inputFilePath.match(/\.tsx?$/)) {
        (0, utils_1.nope)("Only TypeScript currently supported");
    }
    const filesWritten = [];
    function createStoryForFile(filePath) {
        const dirPath = filePath.replace(/^(.+)\/[^/]+$/, "$1/");
        if (!dirPath || dirPath === filePath) {
            (0, utils_1.warn)("Only relative paths supported: use './myFile.ts', not 'myFile.ts'");
            return;
        }
        const sourceFile = (0, tsnode_1.getSourceFile)(filePath);
        if (!sourceFile)
            (0, utils_1.nope)(`An error occurred reading "${filePath}"`);
        let state = (0, utils_1.newEmptyState)(inputFilePath, program.opts().propsformat);
        sourceFile.statements.forEach(statement => {
            switch (statement.kind) {
                case ts.SyntaxKind.EnumDeclaration:
                    if (!ts.isEnumDeclaration(statement))
                        return;
                    return state = (0, parseComponent_1.handleEnum)(state, statement);
                case ts.SyntaxKind.VariableStatement:
                    if (!ts.isVariableStatement(statement))
                        return;
                    return state = (0, parseComponent_1.handleObjectEnum)(state, statement);
                case ts.SyntaxKind.ImportDeclaration:
                    if (!ts.isImportDeclaration(statement))
                        return;
                    return state = (0, parseComponent_1.handleImport)(state, statement);
            }
        });
        sourceFile.statements.forEach(statement => {
            switch (statement.kind) {
                case ts.SyntaxKind.TypeAliasDeclaration:
                    if (!ts.isTypeAliasDeclaration(statement))
                        return;
                    return state = (0, parseComponent_1.handleType)(state, statement);
                case ts.SyntaxKind.InterfaceDeclaration:
                    if (!ts.isInterfaceDeclaration(statement))
                        return;
                    return state = (0, parseComponent_1.handleInterface)(state, statement);
            }
        });
        sourceFile.statements.forEach(fn => {
            switch (fn.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                    if (!ts.isFunctionDeclaration(fn))
                        return;
                    return state = (0, parseComponent_1.handleFunction)(state, fn);
            }
        });
        Object.keys(state.componentsMap).forEach((componentName) => {
            const outputFilePath = `${dirPath}${componentName}.stories.tsx`;
            if (!program.opts().overwrite && (0, utils_1.fileExists)(outputFilePath)) {
                (0, utils_1.warn)(`Error: story file "${outputFilePath}" already exists. Use --overwrite to replace it.`);
                return;
            }
            const { props, isDefaultExport } = state.componentsMap[componentName];
            if (!props)
                return;
            const { importsUsed } = state;
            const renderedStory = (0, storyTemplate_1.renderStory)({
                componentName,
                importsUsed,
                props,
                isDefaultExport,
                wrap: program.opts().wrap || 'div',
            });
            // console.log({outputFilePath})
            // console.log({renderedStory})
            try {
                (0, fs_1.writeFileSync)(outputFilePath, renderedStory);
                filesWritten.push(outputFilePath);
            }
            catch (e) {
                (0, utils_1.warn)(`Something went wrong writing ${outputFilePath}: ${e}`);
            }
        });
    }
    createStoryForFile(inputFilePath);
    if (filesWritten.length) {
        const plur = filesWritten.length > 1 ? 's' : '';
        console.log(`Wrote the following file${plur}: \n${filesWritten.join('\n')}`);
    }
    else {
        console.log("No files written.");
    }
}
exports.run = run;
run();
//# sourceMappingURL=index.js.map