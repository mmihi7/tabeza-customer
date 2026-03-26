// Default configuration for Tabeza project
import { GuardrailConfiguration, ProjectConfiguration, ProjectContext } from '../types';

/**
 * Tabeza Project Context - defines the structure and critical components of the Tabeza project
 */
export const tabezaProjectContext: ProjectContext = {
  rootPath: process.cwd(),
  packageJson: {
    name: '@tabeza/customer',
    version: '1.0.0',
    workspaces: [],
    dependencies: {},
    devDependencies: {},
    scripts: {
      'build': 'next build',
      'dev': 'next dev',
      'test': 'jest'
    }
  },
  tsConfig: {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    },
    include: ['**/*'],
    exclude: ['node_modules', '.next', 'dist']
  },
  criticalFiles: [
    // Core business logic files
    'lib/tokens-service.ts',
    'lib/order-state-helpers.ts',
    'lib/notifications.ts',
    
    // Database and migration files
    'supabase/migrations/**/*.sql',
    'database/migrations/**/*.sql',
    
    // API route files
    'app/api/**/*.ts',
    
    // Authentication and security
    'lib/supabaseClient.ts',
    
    // Payment processing
    'app/api/payments/**/*.ts',
    'app/api/orders/**/*.ts'
  ],
  protectedComponents: [
    {
      type: 'function',
      name: 'isWithinBusinessHours',
      filePath: 'lib/order-state-helpers.ts',
      location: { line: 1, column: 1 },
      dependencies: []
    },
    {
      type: 'function',
      name: 'canCreateNewTab',
      filePath: 'lib/order-state-helpers.ts',
      location: { line: 1, column: 1 },
      dependencies: []
    },
    {
      type: 'function',
      name: 'checkAndUpdateOverdueTabs',
      filePath: 'lib/order-state-helpers.ts',
      location: { line: 1, column: 1 },
      dependencies: []
    },
    {
      type: 'function',
      name: 'awardOrderTokens',
      filePath: 'lib/tokens-service.ts',
      location: { line: 1, column: 1 },
      dependencies: []
    },
    {
      type: 'function',
      name: 'redeemReward',
      filePath: 'lib/tokens-service.ts',
      location: { line: 1, column: 1 },
      dependencies: []
    },
    {
      type: 'class',
      name: 'TokenService',
      filePath: 'lib/tokens-service.ts',
      location: { line: 1, column: 1 },
      dependencies: []
    }
  ],
  businessLogicPaths: [
    'lib',
    'app/api',
    'components'
  ]
};

/**
 * Tabeza Project Configuration - defines validation rules and protection levels
 */
export const tabezaProjectConfiguration: ProjectConfiguration = {
  protectionLevels: {
    database: 'strict',
    api: 'strict',
    sharedTypes: 'moderate',
    businessLogic: 'strict'
  },
  validationRules: [
    // Breaking change prevention rules
    {
      ruleId: 'database-schema-breaking-change',
      enabled: true,
      severity: 'error',
      parameters: {
        requireMigrations: true,
        validateExistingQueries: true,
        checkDataIntegrity: true
      }
    },
    {
      ruleId: 'api-contract-breaking-change',
      enabled: true,
      severity: 'error',
      parameters: {
        requireVersioning: true,
        validateBackwardCompatibility: true,
        checkClientImpact: true
      }
    },
    {
      ruleId: 'type-system-breaking-change',
      enabled: true,
      severity: 'error',
      parameters: {
        checkConsumingApps: true,
        validateTypeCompatibility: true
      }
    },
    
    // Code duplication detection rules
    {
      ruleId: 'code-duplication-detection',
      enabled: true,
      severity: 'warning',
      parameters: {
        similarityThreshold: 0.8,
        minCodeLength: 5
      }
    },
    {
      ruleId: 'function-signature-duplication',
      enabled: true,
      severity: 'info',
      parameters: {
        similarityThreshold: 0.9
      }
    },
    {
      ruleId: 'type-definition-duplication',
      enabled: true,
      severity: 'info',
      parameters: {
        similarityThreshold: 0.85
      }
    },

    // Dependency analysis rules
    {
      ruleId: 'function-deletion-dependency-check',
      enabled: true,
      severity: 'error',
      parameters: {
        preventArbitraryDeletion: true,
        requireDependencyReport: true
      }
    },
    {
      ruleId: 'import-removal-validation',
      enabled: true,
      severity: 'error',
      parameters: {
        checkUsage: true
      }
    },
    {
      ruleId: 'interface-compatibility-check',
      enabled: true,
      severity: 'error',
      parameters: {
        checkImplementations: true
      }
    },

    // Assumption validation rules
    {
      ruleId: 'business-logic-assumption-check',
      enabled: true,
      severity: 'warning',
      parameters: {
        requireDocumentation: true
      }
    },
    {
      ruleId: 'database-operation-assumption-check',
      enabled: true,
      severity: 'warning',
      parameters: {
        checkDataFlow: true
      }
    },
    {
      ruleId: 'configuration-change-assumption-check',
      enabled: true,
      severity: 'warning',
      parameters: {
        checkEnvironments: true
      }
    },

    // Critical component protection rules
    {
      ruleId: 'payment-processing-protection',
      enabled: true,
      severity: 'error',
      parameters: {
        requireAdditionalValidation: true,
        mandatoryTesting: true
      }
    },
    {
      ruleId: 'business-hours-validation',
      enabled: true,
      severity: 'error',
      parameters: {
        validateTabLogic: true,
        checkTimezoneHandling: true
      }
    },
    {
      ruleId: 'token-calculation-validation',
      enabled: true,
      severity: 'error',
      parameters: {
        validateCalculations: true,
        checkBalanceIntegrity: true
      }
    }
  ],

  criticalComponents: [
    {
      paths: [
        'lib/tokens-service.ts',
        'lib/order-state-helpers.ts'
      ],
      patterns: [
        '**/payment*.ts',
        '**/auth*.ts',
        '**/token*.ts',
        '**/business-hours*.ts',
        '**/businessHours*.ts',
        'supabase/migrations/**/*.sql',
        'app/api/payments/**/*.ts',
        'app/api/orders/**/*.ts'
      ],
      components: [],
      customRules: [
        'payment-processing-protection',
        'business-hours-validation',
        'token-calculation-validation'
      ]
    }
  ],
  integrationSettings: {
    gitHooks: {
      preCommit: true,
      prePush: true,
      commitMsg: false,
      customHooks: []
    },
    ide: {
      realTimeValidation: true,
      suggestionLevel: 'comprehensive',
      autoFix: false,
      showImpactAnalysis: true,
      extensions: []
    },
    cicd: {
      validateOnPR: true,
      blockOnErrors: true,
      generateReports: true,
      integrationTests: true,
      platforms: []
    },
    external: []
  }
};

/**
 * Complete Tabeza Guardrails Configuration
 */
export const tabezaGuardrailsConfig: GuardrailConfiguration = {
  // Project-specific configuration
  projectConfiguration: tabezaProjectConfiguration,

  // Protection levels for different component types
  protectionLevels: {
    database: 'strict',      // Database schema changes require strict validation
    api: 'strict',           // API contracts must maintain backward compatibility
    sharedTypes: 'moderate', // Shared types allow some flexibility
    businessLogic: 'strict'  // Business logic changes require careful validation
  },

  // Integration settings for development tools
  integrationSettings: {
    gitHooks: {
      preCommit: true,
      prePush: true,
      commitMsg: false,
      customHooks: []
    },
    ide: {
      realTimeValidation: true,
      suggestionLevel: 'comprehensive',
      autoFix: false,
      showImpactAnalysis: true,
      extensions: []
    },
    cicd: {
      validateOnPR: true,
      blockOnErrors: true,
      generateReports: true,
      integrationTests: true,
      platforms: []
    },
    external: []
  },

  // AI assistant configuration
  aiAssistantSettings: {
    enabledModels: ['gpt-4', 'claude-3', 'copilot'],
    riskThresholds: {
      lowRisk: 0.3,
      mediumRisk: 0.6,
      highRisk: 0.8,
      criticalRisk: 0.9
    },
    enhancedContextLevel: 'comprehensive',
    humanReviewRequired: true,
    monitoringEnabled: true
  },

  // Reporting and analytics settings
  reportingSettings: {
    enabled: true,
    frequency: 'weekly',
    recipients: ['dev-team@tabeza.com'],
    includeMetrics: true,
    includeAnalytics: true,
    customReports: []
  },

  // Emergency override settings
  emergencySettings: {
    overrideEnabled: true,
    requireJustification: true,
    approvers: ['lead-developer', 'tech-lead'],
    auditLevel: 'comprehensive',
    followUpRequired: true
  }
};

/**
 * Factory function to create a configured guardrails system for Tabeza
 */
export function createTabezaGuardrailsSystem() {
  return {
    configuration: tabezaGuardrailsConfig,
    projectContext: tabezaProjectContext
  };
}