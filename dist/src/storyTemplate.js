"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDomTree = exports.unpackWrap = exports.renderStory = void 0;
const utils_1 = require("./utils");
function renderStory({ componentName, hasChildren, importsUsed, inputFilePath, isDefaultExport, props = {}, wrap = 'div', }) {
    const storyName = `${componentName}Story`;
    const defaultValues = (0, utils_1.sortedKeys)(props).reduce((out, k) => {
        const { defaultValue } = props[k];
        if (defaultValue === undefined)
            return out;
        return [...out, [k, defaultValue]];
    }, []);
    const argTypes = (0, utils_1.sortedKeys)(props).reduce((out, k) => {
        const { argType } = props[k];
        if (!argType)
            return out;
        return Object.assign(Object.assign({}, out), { [k]: argType });
    }, {});
    const inputFileName = (0, utils_1.getFileName)(inputFilePath);
    const importsByFile = Object.keys(importsUsed).reduce((map, imp) => {
        const path = importsUsed[imp];
        if (!map[path])
            map[path] = [];
        map[path].push(imp);
        return map;
    }, {});
    const domNodes = unpackWrap(wrap);
    domNodes.push([componentName, (0, utils_1.sortedKeys)(props).map(p => [p, p])]);
    if (hasChildren)
        domNodes.push(['div']);
    // console.log({domNodes})
    // console.log({wrap})
    // console.log({props})
    // console.log({defaultValues})
    // console.log({argTypes})
    return (`import React from "react"
import type {Story} from "@ladle/react"

import ${isDefaultExport ? componentName : `{${componentName}}`} from "./${inputFileName}"
${Object.keys(importsByFile).map(path => `import {${importsByFile[path].join(', ')}} from "${path}"`).join("\n")}

export const ${storyName}: Story<{${(0, utils_1.sortedKeys)(props).map(p => `
  ${p}${props[p].isOptional ? "?" : ""}: ${props[p].type}`).join("")}
}> = ({
  ${(0, utils_1.sortedKeys)(props).join(",\n  ")}
}) => {
  return (
${renderDomTree(componentName, domNodes, 2)}
  )
}
${(defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.length) ? `
${storyName}.args = {${defaultValues.map(([key, defaultValue]) => `
  ${key}: ${defaultValue},`).join('')}
}` : ''}

${storyName}.argTypes = {
${(0, utils_1.indentLines)((0, utils_1.sortedEntries)(argTypes).map(([key, argType]) => `${key}: {
${argType.control ? `  control: {type: "${argType.control.type}"},` : ''}${argType.action ? `  action: "${argType.action}",` : ''}${argType.options ? `
  options: [
${(0, utils_1.indentLines)([...argType.options], 2).join(",\n")}
  ],` : ''}
}`)).join(",\n")}
}`);
}
exports.renderStory = renderStory;
function unpackWrap(wrap) {
    return wrap.split(",").map(str => {
        const propsMatch = str.match(/^([a-zA-Z0-9_]+)\((.+)\)$/);
        if ((propsMatch === null || propsMatch === void 0 ? void 0 : propsMatch.length) !== 3)
            return [str];
        const attrs = propsMatch[2].split("|").map(p => {
            const tuple = p.split("=");
            return [tuple[0], tuple[1]];
        });
        return [propsMatch[1], attrs];
    });
}
exports.unpackWrap = unpackWrap;
function renderDomTree(componentName, domNodes, indentCt = 1) {
    const [first, ...rest] = domNodes;
    const [nodeName, attrs] = first;
    const attrStrs = (attrs || []).map(([k, v]) => v === undefined
        ? `${k}`
        : `${k}={${v}}`);
    const isTheComponent = nodeName === componentName;
    const isLast = !rest.length;
    const domPrefix = isTheComponent
        ? [`<h3>${nodeName}</h3>`]
        : [];
    const renderedProps = isTheComponent
        ? [
            `<${nodeName}`,
            ...attrStrs.map(attr => `  ${attr}`),
            `${isLast ? '/' : ''}>`
        ]
        : [
            `<${nodeName}${attrStrs.length ? " " + attrStrs.join(" ") : ""}${isLast ? ' /' : ''}>`
        ];
    if (isLast)
        return (0, utils_1.indentLines)([
            ...domPrefix,
            ...renderedProps,
        ]).join("\n");
    return (0, utils_1.indentLines)([
        ...domPrefix,
        ...renderedProps,
        renderDomTree(componentName, rest),
        `</${nodeName}>`
    ], indentCt).join("\n");
}
exports.renderDomTree = renderDomTree;
//# sourceMappingURL=storyTemplate.js.map