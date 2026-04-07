# Production Deployment Guide: Cross-Venue Badge Persistence

**Feature**: Cross-Venue Badge Persistence & Display  
**Deployment Date**: TBD  
**Deployment Window**: Low-traffic period (recommended: 2-4 AM EAT)  
**Rollback Plan**: Feature flag can be disabled instantly via Vercel environment variables

---

## Pre-Deployment Checklist

### ✅ Code Readiness
- [ ] All Phase 1-3 tasks completed (API routes, frontend integration, payment integration)
- [ ] Database schema verified (`customer_badges` table exists with correct indexes)
- [ ] All critical paths tested in staging environment
- [ ] No blocking bugs or critical issues in staging

### ✅ Environment Configuration
- [ ] Vercel project identified: `tabeza-customer` (Production: https://app.tabeza.co.ke)
- [ ] Service role key confirmed in Vercel environment variables
- [ ] Database connection verified (Supabase project: `bkaigyrrzsqbfscyznzw`)

### ✅ Monitoring Setup
- [ ] Vercel Analytics enabled
- [ ] Supabase Dashboard access confirmed
- [ ] Error tracking ready (Vercel logs)
- [ ] Performance monitoring baseline established

---

## Deployment Steps

### Step 1: Enable Feature Flag in Vercel

**Action**: Add environment variable to Vercel production environment

1. Go to Vercel Dashboard → `tabeza-customer` project
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED`
   - **Value**: `true`
   - **Environment**: Production only (uncheck Preview and Development)
4. Click **Save**

**Note**: This flag is currently not implemented in the code. If you want to use it as a kill switch, you'll need to add conditional logic in the menu page to check this flag before executing badge persistence logic.

### Step 2: Deploy to Production

**Option A: Automatic Deployment (Recommended)**
```bash
# Push to main branch (triggers automatic Vercel deployment)
git checkout main
git pull origin main
git push origin main
```

**Option B: Manual Deployment via Vercel CLI**
```bash
# From tabeza-customer directory
cd tabeza-customer
vercel --prod
```

**Option C: Vercel Dashboard**
1. Go to Vercel Dashboard → `tabeza-customer` → **Deployments**
2. Find the latest successful build
3. Click **⋯** → **Promote to Production**

### Step 3: Verify Deployment Success

**Check deployment status**:
```bash
# Visit production URL
https://app.tabeza.co.ke

# Check Vercel deployment logs
vercel logs --prod
```

**Verify feature flag is active**:
- Open browser console on production site
- Check if `process.env.NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED` is accessible (if implemented)

---

## Post-Deployment Monitoring (First Hour)

### Immediate Checks (0-15 minutes)

**1. API Route Health**
```bash
# Test badge lookup API (replace with real customer ID)
curl https://app.tabeza.co.ke/api/loyalty/badge/[customer_id]

# Expected: 200 OK with badge data or { badge_level: null }
```

**2. Error Rate Monitoring**
- Open Vercel Dashboard → Analytics → Errors
- Baseline: Should remain < 1% error rate
- Alert threshold: > 5% error rate = investigate immediately

**3. Response Time Monitoring**
- Open Vercel Dashboard → Analytics → Performance
- Badge lookup API: Target p95 < 100ms
- Badge award API: Target p95 < 200ms

**4. Database Query Performance**
- Open Supabase Dashboard → Database → Query Performance
- Check `customer_badges` table queries
- Verify indexes are being used (no sequential scans)

### Functional Verification (15-60 minutes)

**Test Scenario 1: Badge Lookup (Existing Customer)**
1. Open production app as existing customer with badge
2. Navigate to menu page
3. Verify badge displays in header
4. Check browser console for errors
5. Verify prices reflect badge discount

**Test Scenario 2: Badge Award (New Badge Earned)**
1. Create test customer or use staging customer
2. Complete payment that crosses threshold
3. Verify badge award API called (check Vercel logs)
4. Verify notification appears
5. Verify badge persists in database (Supabase Table Editor)

**Test Scenario 3: Cross-Venue Display**
1. Customer with badge at Venue A
2. Open tab at Venue B
3. Verify badge displays at Venue B
4. Verify discount applied with Venue B's percentages

**Test Scenario 4: Payment Integration**
1. Complete a payment on production
2. Verify `loadLoyaltyData()` triggered
3. Check for badge recalculation
4. Verify no errors in console

### Notification System Check

**Verify toast notifications working**:
- Badge upgrade notification appears
- Format: "Congratulations! You've earned [Tier] status at [Venue Name]"
- Sound plays (if enabled)
- Vibration triggers (if enabled on mobile)

---

## Monitoring Queries (24-Hour Period)

### Supabase SQL Queries

**1. Badge Award Activity**
```sql
-- Count badge awards in last 24 hours
SELECT 
  badge_level,
  COUNT(*) as awards,
  COUNT(DISTINCT customer_id) as unique_customers
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY badge_level
ORDER BY badge_level;
```

**2. Active Badge Distribution**
```sql
-- Current active badge distribution
SELECT 
  badge_level,
  COUNT(*) as active_badges
FROM customer_badges
WHERE is_active = true
GROUP BY badge_level
ORDER BY 
  CASE badge_level
    WHEN 'platinum' THEN 4
    WHEN 'gold' THEN 3
    WHEN 'silver' THEN 2
    WHEN 'bronze' THEN 1
  END DESC;
```

**3. Badge Upgrade Frequency**
```sql
-- Badge upgrades in last 24 hours
SELECT 
  customer_id,
  COUNT(*) as badge_count,
  ARRAY_AGG(badge_level ORDER BY awarded_at) as badge_progression
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

**4. Single Active Badge Invariant Check**
```sql
-- Verify no customer has multiple active badges (should return 0 rows)
SELECT 
  customer_id,
  COUNT(*) as active_badge_count,
  ARRAY_AGG(badge_level) as badges
FROM customer_badges
WHERE is_active = true
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

**5. API Performance Metrics**
```sql
-- Average response times from Vercel logs
-- (Run in Vercel Dashboard → Logs → Analytics)
-- Filter by: /api/loyalty/badge/*
-- Metrics: p50, p95, p99 latency
```

### Vercel Analytics Queries

**Error Rate Dashboard**:
- Navigate to: Vercel Dashboard → Analytics → Errors
- Filter by: Last 24 hours
- Group by: Route
- Focus on: `/api/loyalty/badge/*` routes

**Performance Dashboard**:
- Navigate to: Vercel Dashboard → Analytics → Performance
- Filter by: Last 24 hours
- Metrics: TTFB, FCP, LCP
- Focus on: `/menu` page

---

## Success Criteria (24-Hour Mark)

### ✅ Deployment Successful If:
- [ ] Error rate remains < 2% across all badge-related routes
- [ ] Badge lookup API p95 latency < 150ms
- [ ] Badge award API p95 latency < 250ms
- [ ] No customer reports of missing badges
- [ ] No customer reports of incorrect pricing
- [ ] Notification system working (verified via user feedback or test accounts)
- [ ] Cross-venue badge display confirmed working
- [ ] Database invariant maintained (single active badge per customer)
- [ ] No badge downgrades detected (badge rank only increases)

### ⚠️ Warning Signs (Investigate):
- Error rate 2-5%
- Latency p95 > 200ms for lookups
- Customer reports of delayed badge updates
- Notification delivery issues

### 🚨 Rollback Triggers (Immediate Action):
- Error rate > 5%
- Database corruption (multiple active badges per customer)
- Badge downgrades occurring
- Payment processing failures
- Widespread customer complaints

---

## Rollback Procedure

### Immediate Rollback (< 5 minutes)

**Option 1: Disable Feature Flag**
1. Vercel Dashboard → Settings → Environment Variables
2. Set `NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED` = `false`
3. Trigger redeployment (or wait for next automatic deploy)

**Option 2: Revert Deployment**
1. Vercel Dashboard → Deployments
2. Find previous stable deployment
3. Click **⋯** → **Promote to Production**

**Option 3: Emergency Code Revert**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
# Vercel auto-deploys
```

### Post-Rollback Actions
1. Notify team via Slack/email
2. Document rollback reason
3. Preserve logs and error reports
4. Schedule post-mortem
5. Fix issues in staging before re-attempting deployment

---

## Communication Plan

### Pre-Deployment
- [ ] Notify team 24 hours before deployment
- [ ] Schedule deployment window (low-traffic period)
- [ ] Assign on-call engineer for monitoring

### During Deployment
- [ ] Post in team channel: "🚀 Badge persistence deployment started"
- [ ] Update status every 15 minutes during first hour
- [ ] Report any anomalies immediately

### Post-Deployment (24 hours)
- [ ] Post success message: "✅ Badge persistence deployed successfully"
- [ ] Share key metrics (badge awards, error rate, latency)
- [ ] Document any issues encountered and resolutions

### Rollback Communication
- [ ] Immediate notification: "⚠️ Rolling back badge persistence deployment"
- [ ] Explain reason for rollback
- [ ] Provide timeline for fix and re-deployment

---

## Monitoring Dashboard URLs

**Vercel Production**:
- Dashboard: https://vercel.com/[team]/tabeza-customer
- Analytics: https://vercel.com/[team]/tabeza-customer/analytics
- Logs: https://vercel.com/[team]/tabeza-customer/logs

**Supabase Production**:
- Dashboard: https://supabase.com/dashboard/project/bkaigyrrzsqbfscyznzw
- Table Editor: https://supabase.com/dashboard/project/bkaigyrrzsqbfscyznzw/editor
- SQL Editor: https://supabase.com/dashboard/project/bkaigyrrzsqbfscyznzw/sql

**Production App**:
- Customer App: https://app.tabeza.co.ke
- Menu Page: https://app.tabeza.co.ke/menu

---

## Notes

- **Feature Flag**: Currently not implemented in code. If you want a kill switch, add conditional logic in `app/menu/page.tsx` to check `process.env.NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED` before executing badge persistence logic.
- **Database Schema**: `customer_badges` table already exists (created in prior migration).
- **API Routes**: All routes use service role client to bypass RLS.
- **Backward Compatibility**: Feature is additive; no breaking changes to existing functionality.
- **Gradual Rollout**: Feature flag allows instant disable if issues arise.

---

**Deployment Owner**: [Your Name]  
**Deployment Date**: [TBD]  
**Status**: Ready for deployment
