/**
 * Language - Programming language enumeration
 */

export enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  JAVA = 'java',
  GO = 'go',
  RUST = 'rust',
  CSHARP = 'csharp',
  CPP = 'cpp',
  RUBY = 'ruby',
  PHP = 'php',
  UNKNOWN = 'unknown'
}

/**
 * Detect language from file extension
 */
export function detectLanguage(extension: string): Language {
  const ext = extension.toLowerCase().replace('.', '');

  const languageMap: Record<string, Language> = {
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
