/**
 * Language - Programming language enumeration
 */
export declare enum Language {
    TYPESCRIPT = "typescript",
    JAVASCRIPT = "javascript",
    PYTHON = "python",
    JAVA = "java",
    GO = "go",
    RUST = "rust",
    CSHARP = "csharp",
    CPP = "cpp",
    RUBY = "ruby",
    PHP = "php",
    UNKNOWN = "unknown"
}
/**
 * Detect language from file extension
 */
export declare function detectLanguage(extension: string): Language;
//# sourceMappingURL=Language.d.ts.map