"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDomTree = exports.unpackWrap = exports.renderStory = void 0;
const utils_1 = require("./utils");
function renderStory({ componentName, importsUsed, isDefaultExport, props = {}, wrap = 'div', }) {
    const storyName = `${componentName}Story`;
    const defaultValues = Object.keys(props).reduce((out, k) => {
        const { defaultValue } = props[k];
        if (defaultValue === undefined)
            return out;
        return [...out, [k, defaultValue]];
    }, []);
    const argTypes = Object.keys(props).reduce((out, k) => {
        const { argType } = props[k];
        if (!argType)
            return out;
        return Object.assign(Object.assign({}, out), { [k]: argType });
    }, {});
    const importsByFile = Object.keys(importsUsed).reduce((map, imp) => {
        const path = importsUsed[imp];
        if (!map[path])
            map[path] = [];
        map[path].push(imp);
        return map;
    }, {});
    const domNodes = unpackWrap(wrap);
    domNodes.push([componentName, Object.keys(props).map(p => [p, p])]);
    // console.log({domNodes})
    // console.log({wrap})
    // console.log({props})
    // console.log({defaultValues})
    // console.log({argTypes})
    return (`import React from "react"
import type {Story} from "@ladle/react"

import ${isDefaultExport ? componentName : `{${componentName}}`} from "./${componentName}"
${Object.keys(importsByFile).map(path => `import {${importsByFile[path].join(', ')}} from "${path}"`).join("\n")}

export const ${storyName}: Story<{${Object.keys(props).map(p => `
  ${p}${props[p].isOptional ? "?" : ""}: ${props[p].type}`).join("")}
}> = ({
  ${Object.keys(props).join(",\n  ")}
}) => {
  return (
${renderDomTree(domNodes, 2)}
  )
}
${(defaultValues === null || defaultValues === void 0 ? void 0 : defaultValues.length) ? `
${storyName}.args = {${defaultValues.map(([key, defaultValue]) => `
  ${key}: ${defaultValue},`).join('')}
}` : ''}

${storyName}.argTypes = {
${(0, utils_1.indentLines)(Object.entries(argTypes).map(([key, argType]) => `${key}: {
  control: {
    type: "${argType.control.type}",
  },
  options: [
${(0, utils_1.indentLines)([...argType.options], 2).join(",\n")}
  ],
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
function renderDomTree(domNodes, indentCt = 1) {
    const [first, ...rest] = domNodes;
    const [nodeName, attrs] = first;
    const attrStrs = (attrs || []).map(([k, v]) => `${k}={${v}}`);
    if (!rest.length)
        return (0, utils_1.indentLines)([
            `<h3>${nodeName}</h3>`,
            `<${nodeName}`,
            ...attrStrs.map(attr => `  ${attr}`),
            `/>`
        ]).join("\n");
    return (0, utils_1.indentLines)([
        `<${nodeName}${attrStrs.length ? " " + attrStrs.join(" ") : ""}>`,
        renderDomTree(rest),
        `</${nodeName}>`
    ], indentCt).join("\n");
}
exports.renderDomTree = renderDomTree;
//# sourceMappingURL=storyTemplate.js.map