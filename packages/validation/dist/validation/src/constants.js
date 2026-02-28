"use strict";
/**
 * TABEZA Validation Library - Constants
 * Validation rules, patterns, and configuration constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION_CATEGORIES = exports.BUSINESS_RULE_WEIGHTS = exports.AGENT_COMPATIBILITY_RULES = exports.CLOUD_COMPATIBILITY_RULES = exports.ERROR_MESSAGES = exports.SANITIZATION_RULES = exports.BUSINESS_RULES = exports.VALIDATION_LIMITS = exports.VALIDATION_PATTERNS = void 0;
// ============================================================================
// VALIDATION PATTERNS
// ============================================================================
exports.VALIDATION_PATTERNS = {
    // Phone number patterns
    PHONE_E164: /^\+?[1-9]\d{1,14}$/,
    PHONE_KENYA: /^(\+254|254|0)?([17]\d{8})$/,
    PHONE_UGANDA: /^(\+256|256|0)?([37]\d{8})$/,
    PHONE_TANZANIA: /^(\+255|255|0)?([67]\d{8})$/,
    PHONE_RWANDA: /^(\+250|250|0)?([78]\d{8})$/,
    // Amount patterns
    AMOUNT_DECIMAL: /^\d+(\.\d{1,2})?$/,
    AMOUNT_WITH_COMMAS: /^[\d,]+(\.\d{1,2})?$/,
    // ID patterns
    TABEZA_RECEIPT_ID: /^tbz_[a-z0-9]+_[a-z0-9]+$/,
    SESSION_REFERENCE: /^[A-Z0-9]{8}$/,
    EVENT_ID: /^evt_[a-z0-9]+_[a-z0-9]+$/,
    // Text patterns
    CONTROL_CHARS: /[\x00-\x1F\x7F-\x9F]/g,
    EXCESSIVE_WHITESPACE: /\s{2,}/g,
    LEADING_TRAILING_WHITESPACE: /^\s+|\s+$/g,
    // Timestamp patterns
    ISO_8601: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    // Currency patterns
    CURRENCY_CODE: /^[A-Z]{3}$/,
    // KRA PIN pattern (from tax-rules)
    KRA_PIN: /^P\d{9}[A-Z]$/
};
// ============================================================================
// VALIDATION LIMITS
// ============================================================================
exports.VALIDATION_LIMITS = {
    // String lengths
    MAX_TEXT_LENGTH: 1000,
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_REFERENCE_LENGTH: 50,
    // Numeric limits
    MAX_AMOUNT: 999999999.99,
    MIN_AMOUNT: 0.01,
    MAX_QUANTITY: 9999,
    MIN_QUANTITY: 0.01,
    // Collection limits
    MAX_ITEMS_PER_EVENT: 100,
    MAX_EVENTS_PER_SESSION: 50,
    MAX_PAYMENTS_PER_SESSION: 10,
    // Time limits
    MAX_SESSION_DURATION_HOURS: 24,
    MAX_EVENT_AGE_HOURS: 48,
    // Precision limits
    AMOUNT_DECIMAL_PLACES: 2,
    CONFIDENCE_DECIMAL_PLACES: 4
};
// ============================================================================
// BUSINESS RULES
// ============================================================================
exports.BUSINESS_RULES = [
    {
        name: 'SESSION_HAS_EVENTS',
        description: 'Receipt session must have at least one event',
        severity: 'CRITICAL',
        validate: (receipt) => receipt.events && receipt.events.length > 0,
        getMessage: () => 'Receipt session must contain at least one event'
    },
    {
        name: 'TOTALS_MATCH_EVENTS',
        description: 'Session totals must match aggregated event totals',
        severity: 'CRITICAL',
        validate: (receipt) => {
            if (!receipt.totals || !receipt.events)
                return false;
            const eventTotal = receipt.events.reduce((sum, event) => {
                const multiplier = event.type === 'REFUND' || event.type === 'VOID' ? -1 : 1;
                return sum + (event.totals.total * multiplier);
            }, 0);
            return Math.abs(eventTotal - receipt.totals.total) < 0.01;
        },
        getMessage: (receipt) => {
            const eventTotal = receipt.events?.reduce((sum, event) => {
                const multiplier = event.type === 'REFUND' || event.type === 'VOID' ? -1 : 1;
                return sum + (event.totals.total * multiplier);
            }, 0) || 0;
            return `Session total (${receipt.totals?.total}) does not match event totals (${eventTotal})`;
        }
    },
    {
        name: 'PAYMENTS_NOT_EXCEED_TOTAL',
        description: 'Total payments cannot exceed session total',
        severity: 'HIGH',
        validate: (receipt) => {
            if (!receipt.totals)
                return true;
            return receipt.totals.paid <= receipt.totals.total + 0.01; // Allow 1 cent tolerance
        },
        getMessage: (receipt) => `Payments (${receipt.totals?.paid}) exceed session total (${receipt.totals?.total})`
    },
    {
        name: 'VALID_EVENT_SEQUENCE',
        description: 'Events must have valid sequence numbers',
        severity: 'MEDIUM',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            const sequences = receipt.events.map((event) => event.sequence).sort((a, b) => a - b);
            for (let i = 0; i < sequences.length; i++) {
                if (sequences[i] !== i + 1)
                    return false;
            }
            return true;
        },
        getMessage: () => 'Event sequence numbers must be consecutive starting from 1'
    },
    {
        name: 'POSITIVE_AMOUNTS',
        description: 'All amounts must be positive',
        severity: 'HIGH',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            return receipt.events.every((event) => event.items.every((item) => item.unit_price >= 0 && item.total_price >= 0 && item.qty > 0));
        },
        getMessage: () => 'All item amounts and quantities must be positive'
    },
    {
        name: 'VALID_TIMESTAMPS',
        description: 'All timestamps must be valid ISO 8601 format',
        severity: 'MEDIUM',
        validate: (receipt) => {
            const timestamps = [
                receipt.session?.opened_at,
                receipt.session?.closed_at,
                receipt.created_at,
                receipt.updated_at,
                ...(receipt.events?.map((event) => event.printed_at) || [])
            ].filter(Boolean);
            return timestamps.every((timestamp) => exports.VALIDATION_PATTERNS.ISO_8601.test(timestamp));
        },
        getMessage: () => 'All timestamps must be in valid ISO 8601 format'
    },
    {
        name: 'CONSISTENT_CURRENCY',
        description: 'All amounts must use consistent currency',
        severity: 'HIGH',
        validate: (receipt) => {
            const sessionCurrency = receipt.session?.currency;
            if (!sessionCurrency)
                return false;
            const paymentCurrencies = receipt.events?.flatMap((event) => event.payment ? [event.payment.currency] : []) || [];
            return paymentCurrencies.every((currency) => currency === sessionCurrency);
        },
        getMessage: (receipt) => `All currencies must match session currency (${receipt.session?.currency})`
    },
    {
        name: 'VALID_MERCHANT_INFO',
        description: 'Merchant information must be complete',
        severity: 'MEDIUM',
        validate: (receipt) => {
            const merchant = receipt.session?.merchant;
            return merchant && merchant.id && merchant.name;
        },
        getMessage: () => 'Merchant must have valid ID and name'
    },
    {
        name: 'VALID_DEVICE_INFO',
        description: 'Device information must be present',
        severity: 'LOW',
        validate: (receipt) => {
            const device = receipt.session?.device;
            return device && device.printer_id;
        },
        getMessage: () => 'Device must have valid printer ID'
    },
    {
        name: 'REASONABLE_SESSION_DURATION',
        description: 'Session duration should be reasonable',
        severity: 'LOW',
        validate: (receipt) => {
            const session = receipt.session;
            if (!session?.opened_at || !session?.closed_at)
                return true;
            const opened = new Date(session.opened_at);
            const closed = new Date(session.closed_at);
            const durationHours = (closed.getTime() - opened.getTime()) / (1000 * 60 * 60);
            return durationHours <= exports.VALIDATION_LIMITS.MAX_SESSION_DURATION_HOURS;
        },
        getMessage: () => `Session duration exceeds maximum of ${exports.VALIDATION_LIMITS.MAX_SESSION_DURATION_HOURS} hours`
    },
    // Additional business rules extracted from receipt-schema validators
    {
        name: 'REQUIRED_RECEIPT_ID',
        description: 'TABEZA receipt ID is required and must follow format',
        severity: 'CRITICAL',
        validate: (receipt) => {
            const id = receipt.session?.tabeza_receipt_id;
            return id && exports.VALIDATION_PATTERNS.TABEZA_RECEIPT_ID.test(id);
        },
        getMessage: () => 'TABEZA receipt ID is required and must follow format tbz_[id]_[ref]'
    },
    {
        name: 'REQUIRED_SESSION_REFERENCE',
        description: 'Session reference is required and must follow format',
        severity: 'CRITICAL',
        validate: (receipt) => {
            const ref = receipt.session?.session_reference;
            return ref && exports.VALIDATION_PATTERNS.SESSION_REFERENCE.test(ref);
        },
        getMessage: () => 'Session reference is required and must be 8 alphanumeric characters'
    },
    {
        name: 'VALID_KRA_PIN_FORMAT',
        description: 'KRA PIN must follow correct format if provided',
        severity: 'MEDIUM',
        validate: (receipt) => {
            const kraPin = receipt.session?.merchant?.kra_pin;
            if (!kraPin)
                return true; // Optional field
            return exports.VALIDATION_PATTERNS.KRA_PIN.test(kraPin);
        },
        getMessage: () => 'KRA PIN must follow format P#########L (P + 9 digits + letter)'
    },
    {
        name: 'FUTURE_TIMESTAMP_CHECK',
        description: 'Timestamps should not be in the future',
        severity: 'MEDIUM',
        validate: (receipt) => {
            const now = new Date();
            const timestamps = [
                receipt.session?.opened_at,
                receipt.created_at,
                ...(receipt.events?.map((event) => event.printed_at) || [])
            ].filter(Boolean);
            return timestamps.every((timestamp) => {
                try {
                    return new Date(timestamp) <= now;
                }
                catch {
                    return false;
                }
            });
        },
        getMessage: () => 'Timestamps should not be in the future - check system clock'
    },
    {
        name: 'CLOSED_SESSION_TIMESTAMP',
        description: 'Closed sessions must have closed_at timestamp',
        severity: 'HIGH',
        validate: (receipt) => {
            const session = receipt.session;
            if (!session || session.status !== 'CLOSED')
                return true;
            return session.closed_at && exports.VALIDATION_PATTERNS.ISO_8601.test(session.closed_at);
        },
        getMessage: () => 'Closed sessions must have a valid closed_at timestamp'
    },
    {
        name: 'POSITIVE_CONFIDENCE_SCORE',
        description: 'Parsing confidence must be between 0 and 1',
        severity: 'HIGH',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            return receipt.events.every((event) => event.parsed_confidence >= 0 && event.parsed_confidence <= 1);
        },
        getMessage: () => 'Event parsing confidence must be between 0 and 1'
    },
    {
        name: 'LOW_CONFIDENCE_WARNING',
        description: 'Events with low parsing confidence need review',
        severity: 'LOW',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            return receipt.events.every((event) => event.parsed_confidence >= 0.5);
        },
        getMessage: () => 'Some events have low parsing confidence (<50%) - consider manual review'
    },
    {
        name: 'REFUND_REFERENCE_CHECK',
        description: 'Refunds and voids should reference original receipt',
        severity: 'LOW',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            return receipt.events
                .filter((event) => event.type === 'REFUND' || event.type === 'VOID')
                .every((event) => event.source_receipt_no);
        },
        getMessage: () => 'Refunds and voids should include original receipt reference for audit trail'
    },
    {
        name: 'LARGE_TRANSACTION_REFERENCE',
        description: 'Large transactions should have payment references',
        severity: 'LOW',
        validate: (receipt) => {
            const totalAmount = receipt.totals?.total || 0;
            if (totalAmount <= 10000)
                return true; // Only check large transactions
            return receipt.events?.some((event) => event.payment && event.payment.reference) || false;
        },
        getMessage: () => 'Large transactions (>KES 10,000) should include payment references for audit trail'
    },
    {
        name: 'REFUND_NOT_EXCEED_SALES',
        description: 'Total refunds should not exceed total sales',
        severity: 'HIGH',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            const saleTotal = receipt.events
                .filter((e) => e.type === 'SALE')
                .reduce((sum, e) => sum + e.totals.total, 0);
            const refundTotal = receipt.events
                .filter((e) => e.type === 'REFUND')
                .reduce((sum, e) => sum + e.totals.total, 0);
            return refundTotal <= saleTotal;
        },
        getMessage: () => 'Total refunds cannot exceed total sales amount'
    },
    {
        name: 'KRA_TAX_CALCULATION_CHECK',
        description: 'KRA-registered merchants should have proper tax calculations',
        severity: 'LOW',
        validate: (receipt) => {
            const kraPin = receipt.session?.merchant?.kra_pin;
            if (!kraPin || !receipt.events)
                return true;
            return receipt.events.every((event) => event.totals.tax >= 0 && event.totals.tax <= event.totals.subtotal * 0.2 // Max 20% tax
            );
        },
        getMessage: () => 'Tax calculations may be incorrect for KRA-registered merchant - verify tax rates'
    },
    {
        name: 'MPESA_PAYMENT_REFERENCE',
        description: 'M-Pesa payments should include transaction reference',
        severity: 'LOW',
        validate: (receipt) => {
            if (!receipt.events)
                return true;
            return receipt.events
                .filter((event) => event.payment?.method === 'MPESA')
                .every((event) => event.payment.reference);
        },
        getMessage: () => 'M-Pesa payments should include transaction reference for better audit trail'
    }
];
// ============================================================================
// SANITIZATION RULES
// ============================================================================
exports.SANITIZATION_RULES = [
    {
        name: 'TRIM_WHITESPACE',
        description: 'Remove leading and trailing whitespace',
        sanitize: (value) => {
            if (typeof value === 'string') {
                return value.replace(exports.VALIDATION_PATTERNS.LEADING_TRAILING_WHITESPACE, '');
            }
            return value;
        }
    },
    {
        name: 'NORMALIZE_WHITESPACE',
        description: 'Replace multiple whitespace with single space',
        sanitize: (value) => {
            if (typeof value === 'string') {
                return value.replace(exports.VALIDATION_PATTERNS.EXCESSIVE_WHITESPACE, ' ');
            }
            return value;
        }
    },
    {
        name: 'REMOVE_CONTROL_CHARS',
        description: 'Remove control characters',
        sanitize: (value) => {
            if (typeof value === 'string') {
                return value.replace(exports.VALIDATION_PATTERNS.CONTROL_CHARS, '');
            }
            return value;
        }
    },
    {
        name: 'NORMALIZE_PHONE',
        description: 'Normalize phone number to E.164 format',
        sanitize: (value) => {
            if (typeof value !== 'string')
                return value;
            // Remove all non-digit characters except +
            let cleaned = value.replace(/[^\d+]/g, '');
            // Handle Kenya numbers
            if (cleaned.match(/^0[17]\d{8}$/)) {
                return '254' + cleaned.substring(1);
            }
            if (cleaned.match(/^254[17]\d{8}$/)) {
                return cleaned;
            }
            if (cleaned.match(/^\+254[17]\d{8}$/)) {
                return cleaned.substring(1);
            }
            return value; // Return original if no pattern matches
        },
        validate: (value) => {
            if (typeof value !== 'string')
                return false;
            return exports.VALIDATION_PATTERNS.PHONE_E164.test(value);
        }
    },
    {
        name: 'NORMALIZE_AMOUNT',
        description: 'Normalize amount to decimal format',
        sanitize: (value) => {
            if (typeof value === 'number') {
                return Math.round(value * 100) / 100; // Round to 2 decimal places
            }
            if (typeof value === 'string') {
                // Remove commas and parse
                const cleaned = value.replace(/,/g, '');
                const parsed = parseFloat(cleaned);
                if (!isNaN(parsed)) {
                    return Math.round(parsed * 100) / 100;
                }
            }
            return value;
        },
        validate: (value) => {
            return typeof value === 'number' && value >= 0 &&
                Number.isFinite(value) &&
                value === Math.round(value * 100) / 100;
        }
    },
    {
        name: 'NORMALIZE_TEXT',
        description: 'Normalize text fields',
        sanitize: (value) => {
            if (typeof value !== 'string')
                return value;
            return value
                .replace(exports.VALIDATION_PATTERNS.CONTROL_CHARS, '')
                .replace(exports.VALIDATION_PATTERNS.EXCESSIVE_WHITESPACE, ' ')
                .replace(exports.VALIDATION_PATTERNS.LEADING_TRAILING_WHITESPACE, '');
        }
    },
    {
        name: 'UPPERCASE_CURRENCY',
        description: 'Convert currency codes to uppercase',
        sanitize: (value) => {
            if (typeof value === 'string' && exports.VALIDATION_PATTERNS.CURRENCY_CODE.test(value.toUpperCase())) {
                return value.toUpperCase();
            }
            return value;
        }
    }
];
// ============================================================================
// ERROR MESSAGES
// ============================================================================
exports.ERROR_MESSAGES = {
    INVALID_STRUCTURE: 'Invalid receipt data structure',
    MISSING_REQUIRED_FIELD: 'Required field is missing',
    INVALID_FORMAT: 'Invalid field format',
    BUSINESS_RULE_VIOLATION: 'Business rule violation',
    CALCULATION_ERROR: 'Calculation error detected',
    CROSS_SYSTEM_INCOMPATIBILITY: 'Data not compatible across systems',
    SANITIZATION_FAILED: 'Data sanitization failed',
    VALIDATION_TIMEOUT: 'Validation process timed out'
};
// ============================================================================
// SYSTEM COMPATIBILITY RULES
// ============================================================================
exports.CLOUD_COMPATIBILITY_RULES = [
    'No file system dependencies',
    'No OS-specific operations',
    'Serializable data structures',
    'No binary data in JSON',
    'UTF-8 text encoding only'
];
exports.AGENT_COMPATIBILITY_RULES = [
    'Windows-compatible file paths',
    'Local database storage support',
    'Offline operation capability',
    'Binary data handling support',
    'Local file system access'
];
// ============================================================================
// BUSINESS RULE WEIGHTS
// ============================================================================
exports.BUSINESS_RULE_WEIGHTS = {
    CRITICAL: 25,
    HIGH: 15,
    MEDIUM: 10,
    LOW: 5
};
// ============================================================================
// VALIDATION CATEGORIES
// ============================================================================
exports.VALIDATION_CATEGORIES = {
    STRUCTURE: 'Data structure validation',
    BUSINESS_RULES: 'Business logic validation',
    CALCULATIONS: 'Mathematical calculations',
    TIMESTAMPS: 'Date and time validation',
    REFERENCES: 'ID and reference validation',
    CROSS_SYSTEM: 'Cross-system compatibility'
};
//# sourceMappingURL=constants.js.map