/**
 * Language - Programming language enumeration
 */
export var Language;
(function (Language) {
    Language["TYPESCRIPT"] = "typescript";
    Language["JAVASCRIPT"] = "javascript";
    Language["PYTHON"] = "python";
    Language["JAVA"] = "java";
    Language["GO"] = "go";
    Language["RUST"] = "rust";
    Language["CSHARP"] = "csharp";
    Language["CPP"] = "cpp";
    Language["RUBY"] = "ruby";
    Language["PHP"] = "php";
    Language["UNKNOWN"] = "unknown";
})(Language || (Language = {}));
/**
 * Detect language from file extension
 */
export function detectLanguage(extension) {
    const ext = extension.toLowerCase().replace('.', '');
    const languageMap = {
        'ts': Language.TYPESCRIPT,
        'tsx': Language.TYPESCRIPT,
        'js': Language.JAVASCRIPT,
        'jsx': Language.JAVASCRIPT,
        'mjs': Language.JAVASCRIPT,
        'py': Language.PYTHON,
        'java': Language.JAVA,
        'go': Language.GO,
        'rs': Language.RUST,
        'cs': Language.CSHARP,
        'cpp': Language.CPP,
        'cc': Language.CPP,
        'cxx': Language.CPP,
        'rb': Language.RUBY,
        'php': Language.PHP
    };
    return languageMap[ext] || Language.UNKNOWN;
}
//# sourceMappingURL=Language.js.map