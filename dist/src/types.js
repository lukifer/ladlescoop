"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPORTED_MAX_VALUE = exports.ExportedFontWeightObj = exports.ExportedButIgnored = exports.ExportedFontSize = void 0;
// To test imports within AST
var ExportedFontSize;
(function (ExportedFontSize) {
    ExportedFontSize["small"] = "0.8rem";
    ExportedFontSize["medium"] = "1rem";
    ExportedFontSize["large"] = "1.2rem";
})(ExportedFontSize = exports.ExportedFontSize || (exports.ExportedFontSize = {}));
var ExportedButIgnored;
(function (ExportedButIgnored) {
    ExportedButIgnored["small"] = "0.8rem";
    ExportedButIgnored["medium"] = "1rem";
    ExportedButIgnored["large"] = "1.2rem";
})(ExportedButIgnored = exports.ExportedButIgnored || (exports.ExportedButIgnored = {}));
exports.ExportedFontWeightObj = {
    normal: "400",
    bold: "700",
};
exports.EXPORTED_MAX_VALUE = 1000;
//# sourceMappingURL=types.js.map