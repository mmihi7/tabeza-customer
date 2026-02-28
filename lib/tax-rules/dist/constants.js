"use strict";
/**
 * TABEZA Tax Rules Engine - Constants
 * Tax rates, categories, and jurisdiction-specific rules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MESSAGES = exports.CATEGORY_KEYWORDS = exports.KRA_PIN_PATTERNS = exports.MAX_AMOUNT = exports.MIN_AMOUNT = exports.MAX_TAX_RATE = exports.MIN_TAX_RATE = exports.EXCISE_CALCULATION_PRECISION = exports.VAT_CALCULATION_PRECISION = exports.DEFAULT_JURISDICTION = exports.DEFAULT_VAT_RATE = exports.JURISDICTION_RULES = exports.RWANDA_TAX_RULES = exports.TANZANIA_TAX_RULES = exports.UGANDA_TAX_RULES = exports.KENYA_TAX_RULES = exports.TAX_CATEGORIES = exports.SUPPORTED_JURISDICTIONS = void 0;
// ============================================================================
// SUPPORTED JURISDICTIONS
// ============================================================================
exports.SUPPORTED_JURISDICTIONS = ['KE', 'UG', 'TZ', 'RW'];
// ============================================================================
// TAX CATEGORIES
// ============================================================================
exports.TAX_CATEGORIES = {
    FOOD_BASIC: 'Basic food items (bread, milk, etc.)',
    FOOD_PREPARED: 'Prepared food and restaurant meals',
    BEVERAGE_NON_ALCOHOLIC: 'Non-alcoholic beverages',
    BEVERAGE_ALCOHOLIC: 'Alcoholic beverages',
    ALCOHOL: 'Spirits and high-alcohol content',
    TOBACCO: 'Tobacco products',
    FUEL: 'Petroleum products',
    MEDICAL: 'Medical supplies and services',
    EDUCATION: 'Educational services and materials',
    TRANSPORT: 'Transportation services',
    ACCOMMODATION: 'Hotel and accommodation services',
    RETAIL: 'General retail goods',
    SERVICE: 'General services',
    OTHER: 'Other taxable items'
};
// ============================================================================
// KENYA (KE) TAX RULES
// ============================================================================
exports.KENYA_TAX_RULES = {
    jurisdiction: 'KE',
    currency: 'KES',
    standardVATRate: 0.16, // 16% VAT
    zeroRatedCategories: [
        'FOOD_BASIC',
        'MEDICAL',
        'EDUCATION'
    ],
    exemptCategories: [
        'TRANSPORT' // Public transport
    ],
    taxRates: [
        // Standard VAT items
        {
            category: 'FOOD_PREPARED',
            vatRate: 0.16,
            description: 'Restaurant meals and prepared food'
        },
        {
            category: 'BEVERAGE_NON_ALCOHOLIC',
            vatRate: 0.16,
            description: 'Soft drinks and non-alcoholic beverages'
        },
        {
            category: 'RETAIL',
            vatRate: 0.16,
            description: 'General retail goods'
        },
        {
            category: 'SERVICE',
            vatRate: 0.16,
            description: 'General services'
        },
        {
            category: 'ACCOMMODATION',
            vatRate: 0.16,
            description: 'Hotel and accommodation services'
        },
        // Excise tax items
        {
            category: 'BEVERAGE_ALCOHOLIC',
            vatRate: 0.16,
            exciseRate: 0.25, // 25% excise tax
            exciseRateType: 'PERCENTAGE',
            description: 'Beer and alcoholic beverages'
        },
        {
            category: 'ALCOHOL',
            vatRate: 0.16,
            exciseRate: 0.50, // 50% excise tax
            exciseRateType: 'PERCENTAGE',
            description: 'Spirits and high-alcohol content'
        },
        {
            category: 'TOBACCO',
            vatRate: 0.16,
            exciseRate: 2500, // KES 2,500 per kg
            exciseRateType: 'FIXED_AMOUNT',
            description: 'Tobacco products'
        },
        {
            category: 'FUEL',
            vatRate: 0.08, // 8% VAT on fuel
            exciseRate: 21.95, // KES 21.95 per litre (petrol)
            exciseRateType: 'FIXED_AMOUNT',
            description: 'Petroleum products'
        },
        // Zero-rated items
        {
            category: 'FOOD_BASIC',
            vatRate: 0.00,
            description: 'Basic food items (bread, milk, maize flour, etc.)'
        },
        {
            category: 'MEDICAL',
            vatRate: 0.00,
            description: 'Medical supplies and pharmaceutical products'
        },
        {
            category: 'EDUCATION',
            vatRate: 0.00,
            description: 'Educational materials and services'
        }
    ],
    pinValidationRules: {
        format: '^P\\d{9}[A-Z]$', // P + 9 digits + 1 letter
        length: 11,
        checkDigit: true
    },
    complianceRules: [
        {
            rule: 'KRA_PIN_REQUIRED',
            description: 'KRA PIN is required for all registered businesses',
            severity: 'ERROR'
        },
        {
            rule: 'VAT_CALCULATION_ACCURACY',
            description: 'VAT calculations must be accurate to 2 decimal places',
            severity: 'ERROR'
        },
        {
            rule: 'EXCISE_TAX_DECLARATION',
            description: 'Excise tax must be declared for applicable items',
            severity: 'ERROR'
        },
        {
            rule: 'RECEIPT_NUMBERING',
            description: 'Receipts should have sequential numbering',
            severity: 'WARNING'
        },
        {
            rule: 'ETIMS_INTEGRATION',
            description: 'Consider eTIMS integration for tax compliance',
            severity: 'INFO'
        }
    ]
};
// ============================================================================
// UGANDA (UG) TAX RULES
// ============================================================================
exports.UGANDA_TAX_RULES = {
    jurisdiction: 'UG',
    currency: 'UGX',
    standardVATRate: 0.18, // 18% VAT
    zeroRatedCategories: [
        'FOOD_BASIC',
        'MEDICAL',
        'EDUCATION'
    ],
    exemptCategories: [
        'TRANSPORT'
    ],
    taxRates: [
        {
            category: 'FOOD_PREPARED',
            vatRate: 0.18,
            description: 'Restaurant meals and prepared food'
        },
        {
            category: 'BEVERAGE_NON_ALCOHOLIC',
            vatRate: 0.18,
            description: 'Soft drinks and beverages'
        },
        {
            category: 'RETAIL',
            vatRate: 0.18,
            description: 'General retail goods'
        },
        {
            category: 'SERVICE',
            vatRate: 0.18,
            description: 'General services'
        },
        {
            category: 'FOOD_BASIC',
            vatRate: 0.00,
            description: 'Basic food items'
        }
    ],
    pinValidationRules: {
        format: '^\\d{10}$', // 10 digits
        length: 10,
        checkDigit: false
    },
    complianceRules: [
        {
            rule: 'TIN_REQUIRED',
            description: 'Tax Identification Number (TIN) required for businesses',
            severity: 'ERROR'
        },
        {
            rule: 'VAT_CALCULATION_ACCURACY',
            description: 'VAT calculations must be accurate',
            severity: 'ERROR'
        }
    ]
};
// ============================================================================
// TANZANIA (TZ) TAX RULES
// ============================================================================
exports.TANZANIA_TAX_RULES = {
    jurisdiction: 'TZ',
    currency: 'TZS',
    standardVATRate: 0.18, // 18% VAT
    zeroRatedCategories: [
        'FOOD_BASIC',
        'MEDICAL',
        'EDUCATION'
    ],
    exemptCategories: [
        'TRANSPORT'
    ],
    taxRates: [
        {
            category: 'FOOD_PREPARED',
            vatRate: 0.18,
            description: 'Restaurant meals and prepared food'
        },
        {
            category: 'RETAIL',
            vatRate: 0.18,
            description: 'General retail goods'
        },
        {
            category: 'FOOD_BASIC',
            vatRate: 0.00,
            description: 'Basic food items'
        }
    ],
    pinValidationRules: {
        format: '^\\d{9}-\\d{5}$', // 9 digits - 5 digits
        length: 15,
        checkDigit: false
    },
    complianceRules: [
        {
            rule: 'TIN_REQUIRED',
            description: 'Tax Identification Number required',
            severity: 'ERROR'
        }
    ]
};
// ============================================================================
// RWANDA (RW) TAX RULES
// ============================================================================
exports.RWANDA_TAX_RULES = {
    jurisdiction: 'RW',
    currency: 'RWF',
    standardVATRate: 0.18, // 18% VAT
    zeroRatedCategories: [
        'FOOD_BASIC',
        'MEDICAL',
        'EDUCATION'
    ],
    exemptCategories: [
        'TRANSPORT'
    ],
    taxRates: [
        {
            category: 'FOOD_PREPARED',
            vatRate: 0.18,
            description: 'Restaurant meals and prepared food'
        },
        {
            category: 'RETAIL',
            vatRate: 0.18,
            description: 'General retail goods'
        },
        {
            category: 'FOOD_BASIC',
            vatRate: 0.00,
            description: 'Basic food items'
        }
    ],
    pinValidationRules: {
        format: '^\\d{9}$', // 9 digits
        length: 9,
        checkDigit: false
    },
    complianceRules: [
        {
            rule: 'TIN_REQUIRED',
            description: 'Tax Identification Number required',
            severity: 'ERROR'
        }
    ]
};
// ============================================================================
// JURISDICTION RULES REGISTRY
// ============================================================================
exports.JURISDICTION_RULES = {
    KE: exports.KENYA_TAX_RULES,
    UG: exports.UGANDA_TAX_RULES,
    TZ: exports.TANZANIA_TAX_RULES,
    RW: exports.RWANDA_TAX_RULES
};
// ============================================================================
// DEFAULT VALUES
// ============================================================================
exports.DEFAULT_VAT_RATE = 0.16; // 16% (Kenya standard)
exports.DEFAULT_JURISDICTION = 'KE';
exports.VAT_CALCULATION_PRECISION = 2; // 2 decimal places
exports.EXCISE_CALCULATION_PRECISION = 2; // 2 decimal places
// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
exports.MIN_TAX_RATE = 0.00;
exports.MAX_TAX_RATE = 1.00; // 100%
exports.MIN_AMOUNT = 0.01; // 1 cent minimum
exports.MAX_AMOUNT = 999999999.99; // Reasonable maximum
// ============================================================================
// KRA PIN VALIDATION PATTERNS
// ============================================================================
exports.KRA_PIN_PATTERNS = {
    INDIVIDUAL: /^P\d{9}[A-Z]$/,
    COMPANY: /^P\d{9}[A-Z]$/,
    FULL_FORMAT: /^P\d{9}[A-Z]$/
};
// ============================================================================
// CATEGORY MAPPINGS
// ============================================================================
exports.CATEGORY_KEYWORDS = {
    // Food items
    'bread': 'FOOD_BASIC',
    'milk': 'FOOD_BASIC',
    'flour': 'FOOD_BASIC',
    'rice': 'FOOD_BASIC',
    'maize': 'FOOD_BASIC',
    'ugali': 'FOOD_BASIC',
    'meal': 'FOOD_PREPARED',
    'pizza': 'FOOD_PREPARED',
    'burger': 'FOOD_PREPARED',
    'chicken': 'FOOD_PREPARED',
    // Beverages
    'soda': 'BEVERAGE_NON_ALCOHOLIC',
    'juice': 'BEVERAGE_NON_ALCOHOLIC',
    'water': 'BEVERAGE_NON_ALCOHOLIC',
    'coffee': 'BEVERAGE_NON_ALCOHOLIC',
    'tea': 'BEVERAGE_NON_ALCOHOLIC',
    'beer': 'BEVERAGE_ALCOHOLIC',
    'wine': 'BEVERAGE_ALCOHOLIC',
    'whiskey': 'ALCOHOL',
    'vodka': 'ALCOHOL',
    'gin': 'ALCOHOL',
    // Other categories
    'cigarette': 'TOBACCO',
    'tobacco': 'TOBACCO',
    'petrol': 'FUEL',
    'diesel': 'FUEL',
    'medicine': 'MEDICAL',
    'drug': 'MEDICAL',
    'book': 'EDUCATION',
    'taxi': 'TRANSPORT',
    'bus': 'TRANSPORT',
    'hotel': 'ACCOMMODATION',
    'room': 'ACCOMMODATION'
};
// ============================================================================
// ERROR MESSAGES
// ============================================================================
exports.ERROR_MESSAGES = {
    INVALID_JURISDICTION: 'Invalid or unsupported jurisdiction',
    INVALID_TAX_RATE: 'Tax rate must be between 0 and 1',
    INVALID_AMOUNT: 'Amount must be positive',
    INVALID_KRA_PIN: 'Invalid KRA PIN format',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
    CALCULATION_ERROR: 'Error in tax calculation',
    COMPLIANCE_VIOLATION: 'Tax compliance violation detected'
};
//# sourceMappingURL=constants.js.map