/**
 * FeatureFlags - Control feature rollout and experimental features
 */

export interface ParserFeatureFlags {
  // Parser selection
  useRealTypeScriptParser: boolean;
  useRealPythonParser: boolean;

  // Parsing features
  enableDiagnostics: boolean;
  includeComments: boolean;
  resolveSymbols: boolean;
  detectDependencies: boolean;

  // Performance features
  enableCaching: boolean;
  parallelParsing: boolean;
  lazyParsing: boolean;

  // Error handling
  enableErrorRecovery: boolean;
  continueOnError: boolean;

  // Output features
  includeSourceMaps: boolean;
  includeMetadata: boolean;
  generateStatistics: boolean;
}

export const DEFAULT_FLAGS: ParserFeatureFlags = {
  // Start with stub parsers in Phase 1
  useRealTypeScriptParser: false,
  useRealPythonParser: false,

  // Conservative defaults for stability
  enableDiagnostics: false,
  includeComments: false,
  resolveSymbols: false,
  detectDependencies: true,

  // Performance features off by default
  enableCaching: false,
  parallelParsing: false,
  lazyParsing: false,

  // Error handling
  enableErrorRecovery: false,
  continueOnError: false,

  // Output features
  includeSourceMaps: false,
  includeMetadata: true,
  generateStatistics: false
};

export const DEVELOPMENT_FLAGS: ParserFeatureFlags = {
  ...DEFAULT_FLAGS,
  enableDiagnostics: true,
  includeComments: true,
  includeSourceMaps: true,
  generateStatistics: true
};

export const PRODUCTION_FLAGS: ParserFeatureFlags = {
  ...DEFAULT_FLAGS,
  enableCaching: true,
  enableErrorRecovery: true,
  continueOnError: true,
  includeMetadata: false
};

export const EXPERIMENTAL_FLAGS: ParserFeatureFlags = {
  ...DEFAULT_FLAGS,
  useRealTypeScriptParser: true,
  useRealPythonParser: true,
  resolveSymbols: true,
  parallelParsing: true,
  lazyParsing: true
};

export class FeatureFlagManager {
  private flags: ParserFeatureFlags;

  constructor(
    initialFlags: Partial<ParserFeatureFlags> = {},
    profile?: 'default' | 'development' | 'production' | 'experimental'
  ) {
    // Select base flags based on profile
    const baseFlags = this.getProfileFlags(profile);

    // Merge with provided flags
    this.flags = { ...baseFlags, ...initialFlags };
  }

  /**
   * Get flags for a specific profile
   */
  private getProfileFlags(profile?: string): ParserFeatureFlags {
    switch (profile) {
      case 'development':
        return DEVELOPMENT_FLAGS;
      case 'production':
        return PRODUCTION_FLAGS;
      case 'experimental':
        return EXPERIMENTAL_FLAGS;
      default:
        return DEFAULT_FLAGS;
    }
  }

  /**
   * Get current flags
   */
  getFlags(): ParserFeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check if a specific flag is enabled
   */
  isEnabled(flag: keyof ParserFeatureFlags): boolean {
    return this.flags[flag];
  }

  /**
   * Enable a specific flag
   */
  enable(flag: keyof ParserFeatureFlags): void {
    this.flags[flag] = true;
  }

  /**
   * Disable a specific flag
   */
  disable(flag: keyof ParserFeatureFlags): void {
    this.flags[flag] = false;
  }

  /**
   * Toggle a specific flag
   */
  toggle(flag: keyof ParserFeatureFlags): void {
    this.flags[flag] = !this.flags[flag];
  }

  /**
   * Update multiple flags at once
   */
  updateFlags(updates: Partial<ParserFeatureFlags>): void {
    this.flags = { ...this.flags, ...updates };
  }

  /**
   * Reset to default flags
   */
  reset(): void {
    this.flags = { ...DEFAULT_FLAGS };
  }

  /**
   * Get flags as environment variables
   */
  toEnvironment(): Record<string, string> {
    const env: Record<string, string> = {};

    for (const [key, value] of Object.entries(this.flags)) {
      const envKey = `PARSER_FLAG_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      env[envKey] = String(value);
    }

    return env;
  }

  /**
   * Load flags from environment
   */
  static fromEnvironment(): FeatureFlagManager {
    const flags: Partial<ParserFeatureFlags> = {};

    for (const key of Object.keys(DEFAULT_FLAGS)) {
      const envKey = `PARSER_FLAG_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
      const envValue = process.env[envKey];

      if (envValue !== undefined) {
        (flags as any)[key] = envValue === 'true';
      }
    }

    return new FeatureFlagManager(flags);
  }

  /**
   * Get a summary of enabled features
   */
  getSummary(): string[] {
    const enabled: string[] = [];

    for (const [key, value] of Object.entries(this.flags)) {
      if (value) {
        enabled.push(key);
      }
    }

    return enabled;
  }
}