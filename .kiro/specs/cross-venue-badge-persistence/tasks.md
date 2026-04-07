# Implementation Plan: Cross-Venue Badge Persistence & Display

## Overview

This implementation transforms the Tabeza loyalty system from stateless, session-only badge calculation into a persistent, cross-venue recognition system. Badges earned at one venue will be stored permanently in the database and displayed at ALL venues. The implementation follows a 5-phase approach: Database & API Foundation → Frontend Integration → Payment Integration → Testing & Optimization → Documentation & Deployment.

**Key Technical Changes:**
- Add badge persistence via `customer_badges` table (already exists)
- Create API routes for badge lookup and award operations
- Modify menu page to fetch and display global badges
- Integrate badge recalculation with payment completion
- Maintain venue-specific earning criteria while ensuring global visibility

**Foundation:** Builds on existing `venue-specific-badge-threshold-fix` implementation.

---

## Phase 1: Database & API Foundation

- [x] 1. Create badge lookup API route
  - Create `app/api/loyalty/badge/[customer_id]/route.ts`
  - Implement GET handler to query `customer_badges` table
  - Return highest active badge (ORDER BY badge_level DESC, LIMIT 1)
  - Include venue name via JOIN with `bars` table
  - Handle no-badge case (return `{ badge_level: null }`)
  - Add error handling for database failures
  - _Requirements: 3.1, 3.5_
  - _Design: API Routes → GET /api/loyalty/badge/[customer_id]_

- [ ]* 1.1 Write unit tests for badge lookup API
  - Test successful badge retrieval
  - Test no-badge case (first-time user)
  - Test multiple badges (returns highest)
  - Test database error handling
  - _Requirements: 3.1_

- [x] 2. Create badge award API route
  - Create `app/api/loyalty/badge/award/route.ts`
  - Implement POST handler with input validation
  - Validate badge_level is one of: bronze, silver, gold, platinum
  - Validate spend_amount is positive and reasonable (<1M)
  - Query current active badge for customer
  - Compare badge ranks (bronze=1, silver=2, gold=3, platinum=4)
  - If new rank <= current rank, return `{ upgraded: false }`
  - If upgrade needed, execute transaction: deactivate old badge, insert new badge
  - Return `{ upgraded: true/false, newBadge, oldBadge }`
  - _Requirements: 1.6, 2.1, 2.2, 2.3, 2.5, 4.1, 4.2, 4.3_
  - _Design: API Routes → POST /api/loyalty/badge/award_

- [ ]* 2.1 Write unit tests for badge award API
  - Test first badge award (no previous badge)
  - Test badge upgrade (bronze → silver)
  - Test badge upgrade skip (bronze → gold)
  - Test reject lower badge (gold customer, silver request)
  - Test invalid badge level
  - Test invalid spend amount
  - Test concurrent upgrade handling
  - _Requirements: 2.1, 2.5, 4.5_

- [ ]* 2.2 Write property test for badge tier determination
  - **Property 3: Badge Tier Determination**
  - **Validates: Requirements 1.4**
  - Generate random spend amounts (0-100,000) and threshold configurations
  - Verify correct badge level returned for any spend/threshold combination
  - Use fast-check with 100 iterations
  - _Design: Property 3_

- [ ]* 2.3 Write property test for single active badge invariant
  - **Property 6: Single Active Badge Invariant**
  - **Validates: Requirements 2.4**
  - Generate random sequences of badge award operations
  - Verify exactly 0 or 1 active badge exists after any operation sequence
  - Use fast-check with 100 iterations
  - _Design: Property 6_

- [ ]* 2.4 Write property test for badge non-downgrade invariant
  - **Property 12: Badge Non-Downgrade Invariant**
  - **Validates: Requirements 4.5**
  - Generate random sequences of badge levels
  - Verify badge rank never decreases across operations
  - Use fast-check with 100 iterations
  - _Design: Property 12_

- [x] 3. Checkpoint - Verify API routes working
  - Test badge lookup API manually with Postman/curl
  - Test badge award API manually with various inputs
  - Verify database state after operations (single active badge)
  - Ensure all tests pass, ask the user if questions arise

---

## Phase 2: Frontend Integration

- [x] 4. Add global badge state to menu page
  - Open `app/menu/page.tsx`
  - Add state: `const [globalBadge, setGlobalBadge] = useState<BadgeDisplay | null>(null)`
  - Add state: `const [badgeLoading, setBadgeLoading] = useState(false)`
  - Define TypeScript interface for BadgeDisplay
  - _Requirements: 3.1_
  - _Design: State Management → New State Variables_

- [x] 5. Modify loadLoyaltyData to fetch global badge
  - In `loadLoyaltyData()` function, add badge fetch before tier calculation
  - Call `GET /api/loyalty/badge/[customer_id]`
  - Store result in `globalBadge` state
  - Use global badge level for `spendTier` state (not local calculation)
  - Keep existing visit data fetch and venue discount fetch unchanged
  - _Requirements: 3.1, 3.2_
  - _Design: Components → Loyalty Data Loading_

- [x] 6. Implement badge upgrade detection and award
  - After fetching visit data and calculating earned tier locally
  - Compare earned tier rank vs global badge rank
  - If earned tier > global badge, call `POST /api/loyalty/badge/award`
  - Pass customer_id, bar_id, badge_level (earned tier), spend_amount
  - Handle response: if `upgraded: true`, update states and show notification
  - _Requirements: 1.5, 1.6, 4.1, 4.2, 4.3, 4.4_
  - _Design: Components → Loyalty Data Loading (New Flow)_

- [x] 7. Add badge upgrade notification
  - After successful badge award API response with `upgraded: true`
  - Extract new badge level and venue name
  - Call `showToast()` with format: "Congratulations! You've earned [Tier] status at [Venue Name]"
  - Set duration to 8000ms (longer than standard notifications)
  - Play acceptance sound if `notificationPrefs.soundEnabled`
  - Trigger vibration pattern [200, 100, 200, 100, 200] if `notificationPrefs.vibrationEnabled`
  - _Requirements: 4.4, 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Design: Components → Badge Upgrade Notification_

- [ ]* 7.1 Write unit tests for notification content
  - Test notification title format
  - Test notification message includes venue name
  - Test sound plays when enabled
  - Test vibration triggers when enabled
  - Test no sound/vibration when disabled
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 8. Update renderLoyaltyIcons to use global badge
  - Modify `renderLoyaltyIcons()` function in `app/menu/page.tsx`
  - Badge shape determined by `globalBadge?.badge_level` (not local spendTier)
  - Badge count determined by `loyaltyData?.visitTier` (weekly visits at current venue)
  - Map badge levels: bronze → Circle, silver → Shield, gold → Crown, platinum → Crown
  - Calculate icon count: visitTier gold=3, silver=2, bronze=1
  - Handle case where globalBadge exists but visitTier is 'new' (show 1 icon)
  - _Requirements: 3.2, 3.3, 3.4, 5.1, 5.2_
  - _Design: Components → Badge Display Component_

- [ ]* 8.1 Write unit tests for badge display logic
  - Test badge shape matches global badge level
  - Test icon count matches visit frequency
  - Test cross-venue display (badge from venue A shown at venue B)
  - Test first-time user (no badge, no icons)
  - Test new venue visit (global badge shown, 1 icon)
  - _Requirements: 3.2, 3.3, 3.4, 5.1, 5.2_

- [ ]* 8.2 Write property test for visit frequency icon count
  - **Property 14: Visit Frequency Icon Count**
  - **Validates: Requirements 5.1, 5.2**
  - Generate random weekly visit counts (0-10)
  - Verify icon count: <2 visits=1 icon, 2 visits=2 icons, 3+ visits=3 icons
  - Use fast-check with 100 iterations
  - _Design: Property 14_

- [x] 9. Update menu price calculation to use global badge
  - Verify discount calculation uses `spendTier` state (now reflects global badge)
  - Ensure formula: `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)`
  - No code changes needed if spendTier state is correctly updated
  - Test that prices update automatically when spendTier changes
  - _Requirements: 7.1, 7.2, 7.4_
  - _Design: Integration with Existing Discount System_

- [ ]* 9.1 Write property test for discount formula
  - **Property 17: Discount Formula Application**
  - **Validates: Requirements 7.4**
  - Generate random base prices (100-10,000) and discount percentages (0-30)
  - Verify displayed price = basePrice × (1 - totalDiscount/100)
  - Verify displayed price <= base price
  - Use fast-check with 100 iterations
  - _Design: Property 17_

- [x] 10. Checkpoint - Verify frontend integration
  - Test badge display in menu header
  - Test badge shape reflects global badge
  - Test icon count reflects visit frequency
  - Test prices reflect global badge discount
  - Ensure all tests pass, ask the user if questions arise

---

## Phase 3: Payment Integration

- [x] 11. Integrate badge recalculation with payment completion
  - Locate payment realtime subscription handler in `app/menu/page.tsx`
  - After payment INSERT event detected, call `loadLoyaltyData()`
  - This triggers badge fetch, tier calculation, and upgrade check
  - Ensure notification shows only when API confirms upgrade (not just local calculation)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - _Design: Data Flow → Step 1-5 (Payment to Badge Upgrade)_

- [ ]* 11.1 Write integration test for payment-to-badge flow
  - Create test customer with no badge
  - Simulate payment completion totaling 5,500 KES
  - Verify badge recalculation triggered
  - Verify Silver badge awarded
  - Verify notification shown
  - Verify menu prices updated
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 12. Add error handling for badge award failures
  - Wrap badge award API call in try/catch
  - Log errors with context (customer_id, bar_id, badge_level)
  - On failure, continue without badge upgrade (graceful degradation)
  - Show generic error toast: "Unable to update loyalty status. Please refresh."
  - _Requirements: 9.5_
  - _Design: Error Handling → Badge Upgrade Race Condition_

- [ ]* 12.1 Write unit tests for error scenarios
  - Test database connection failure during badge lookup
  - Test invalid badge level in award request
  - Test concurrent badge upgrade attempts
  - Test missing venue thresholds (fallback to defaults)
  - _Requirements: 9.5_

- [x] 13. Test cross-venue badge display
  - Create test scenario: customer earns Silver at Popos
  - Open tab at Kikao (different venue)
  - Verify Silver badge displays at Kikao
  - Verify Silver discount applied using Kikao's discount percentages
  - Verify visit frequency shows 1 icon (first visit at Kikao)
  - _Requirements: 3.2, 3.3, 7.1, 7.2_
  - _Design: Edge Cases → Customer Visits New Venue for First Time_

- [ ]* 13.1 Write integration test for cross-venue display
  - Setup: customer has Silver badge at venue A
  - Action: open tab at venue B (never visited before)
  - Verify: Silver badge displays at venue B
  - Verify: Silver discount applied with venue B's percentages
  - Verify: visit frequency = 1 icon
  - _Requirements: 3.2, 3.3_

- [ ] 14. Checkpoint - Verify payment integration
  - Test payment completion triggers badge recalculation
  - Test badge upgrade notification appears
  - Test cross-venue badge display works
  - Test error handling for failed operations
  - Ensure all tests pass, ask the user if questions arise

---

## Phase 4: Testing & Optimization

- [ ] 15. Write remaining property-based tests
  - [ ] 15.1 Property 1: Average Spend Calculation
    - **Validates: Requirements 1.1**
    - Generate random tab balances and visit counts
    - Verify average = sum / count
    - _Design: Property 1_
  
  - [ ] 15.2 Property 2: Venue Threshold Retrieval
    - **Validates: Requirements 1.2, 1.3**
    - Generate random venue threshold configurations (some NULL)
    - Verify system defaults used when NULL
    - _Design: Property 2_
  
  - [ ] 15.3 Property 4: Badge Upgrade Detection
    - **Validates: Requirements 1.5, 1.6**
    - Generate random earned tiers and current badges
    - Verify upgrade triggered when earned > current
    - _Design: Property 4_
  
  - [ ] 15.4 Property 5: Badge Persistence
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Generate random badge awards
    - Verify all required fields written to database
    - _Design: Property 5_
  
  - [ ] 15.5 Property 7: Badge Upgrade Transaction
    - **Validates: Requirements 2.5**
    - Generate random upgrade sequences
    - Verify old badge deactivated before new badge inserted
    - _Design: Property 7_
  
  - [ ] 15.6 Property 8: Highest Active Badge Retrieval
    - **Validates: Requirements 3.1**
    - Generate random badge collections per customer
    - Verify highest rank badge returned
    - _Design: Property 8_
  
  - [ ] 15.7 Property 20: Badge Serialization Round-Trip
    - **Validates: Requirements 9.4**
    - Generate random badge objects
    - Verify serialize → deserialize produces equivalent object
    - _Design: Property 20_
  
  - [ ] 15.8 Property 21: Badge Validation
    - **Validates: Requirements 9.3, 9.5**
    - Generate random badge data (some invalid)
    - Verify validation catches missing/invalid fields
    - _Design: Property 21_

- [ ]* 16. Write edge case tests
  - Test first-time user (no badge, no history)
  - Test badge upgrade skip (bronze → gold, skipping silver)
  - Test badge duplication decay (3x/week → 0x/week after 2 weeks)
  - Test venue threshold change (existing badges preserved)
  - Test customer account deletion (badges cascade delete)
  - Test badge display with no completed visits at current venue
  - _Requirements: 2.4, 4.5, 5.3, 5.4_
  - _Design: Edge Cases and Special Scenarios_

- [ ]* 17. Performance testing and optimization
  - Measure badge lookup latency (target: p95 < 100ms)
  - Measure badge award transaction time (target: < 50ms)
  - Test concurrent badge upgrades (100+ simultaneous requests)
  - Verify database indexes used (check EXPLAIN ANALYZE)
  - Implement query batching if needed (combine visits + badge + discounts)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - _Design: Performance Considerations_

- [ ] 18. Add caching strategy (optional enhancement)
  - Implement API response caching for badge lookups (5 min TTL)
  - Add Cache-Control headers: `public, s-maxage=300, stale-while-revalidate=600`
  - Test cache invalidation on badge upgrade
  - Measure cache hit rate and latency improvement
  - _Design: Performance Considerations → API Response Caching_

- [ ] 19. Checkpoint - Verify all tests passing
  - Run all unit tests (target: 80%+ coverage)
  - Run all property tests (22 properties × 100 iterations each)
  - Run all integration tests
  - Run all edge case tests
  - Verify performance benchmarks met
  - Ensure all tests pass, ask the user if questions arise

---

## Phase 5: Documentation & Deployment

- [ ] 20. Update API documentation
  - Document `GET /api/loyalty/badge/[customer_id]` endpoint
  - Document `POST /api/loyalty/badge/award` endpoint
  - Include request/response examples
  - Document error codes and handling
  - Add authentication requirements
  - _Design: API Routes section_

- [ ] 21. Add monitoring and logging
  - Add structured logging for badge lookups (customer_id, badge_level, duration_ms)
  - Add structured logging for badge awards (customer_id, old_level, new_level, venue)
  - Add structured logging for badge upgrades (notification shown, sound/vibration)
  - Set up performance monitoring dashboard (badge lookups/min, awards/hour, latency)
  - Configure alerts: error rate > 5%, p99 latency > 500ms
  - _Design: Monitoring & Observability_

- [ ] 22. Staging deployment and testing
  - Deploy to staging environment
  - Run full QA test suite
  - Test with real venue data (anonymized)
  - Verify cross-venue badge display
  - Test payment → badge upgrade flow end-to-end
  - Monitor staging metrics for 24 hours
  - _Design: Migration Strategy → Gradual Rollout_

- [x] 23. Production deployment
  - Enable feature flag: `NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED=true`
  - Deploy to production during low-traffic window
  - Monitor error rates and latency for first hour
  - Verify badge awards happening correctly
  - Check notification system working
  - Monitor for 24 hours before declaring success
  - _Design: Migration Strategy → Gradual Rollout_

- [ ] 24. Post-deployment verification
  - Verify badge persistence working across all venues
  - Verify cross-venue badge display functioning
  - Verify payment integration triggering badge recalculation
  - Check monitoring dashboards for anomalies
  - Collect feedback from venue owners and customers
  - Document any issues and create follow-up tasks

---

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties (22 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end user flows
- Checkpoints ensure incremental validation at phase boundaries
- Feature flag allows gradual rollout and easy rollback if needed
- All database schema already exists (customer_badges table created in prior migration)
- API routes use service role client to bypass RLS (customer app pattern)
- Badge upgrades are one-way only (never downgrade)
- Cross-venue display is automatic (no configuration needed)
