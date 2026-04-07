#!/bin/bash

# Production Deployment Script: Cross-Venue Badge Persistence
# Usage: ./deploy-production.sh

set -e  # Exit on error

echo "🚀 Cross-Venue Badge Persistence - Production Deployment"
echo "=========================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from tabeza-customer directory${NC}"
    exit 1
fi

# Confirm deployment
echo -e "${YELLOW}⚠️  WARNING: This will deploy to PRODUCTION${NC}"
echo ""
echo "Production URL: https://app.tabeza.co.ke"
echo "Deployment time: $(date)"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "📋 Pre-Deployment Checklist"
echo "----------------------------"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not installed${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi
echo -e "${GREEN}✓${NC} Vercel CLI installed"

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel${NC}"
    echo "Login with: vercel login"
    exit 1
fi
echo -e "${GREEN}✓${NC} Logged in to Vercel"

# Check git status
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
    git status --short
    read -p "Continue anyway? (yes/no): " continue_dirty
    if [ "$continue_dirty" != "yes" ]; then
        echo "Deployment cancelled. Commit your changes first."
        exit 0
    fi
else
    echo -e "${GREEN}✓${NC} Git working directory clean"
fi

# Check current branch
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

if [ "$current_branch" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on main branch${NC}"
    read -p "Continue anyway? (yes/no): " continue_branch
    if [ "$continue_branch" != "yes" ]; then
        echo "Deployment cancelled. Switch to main branch first."
        exit 0
    fi
fi

echo ""
echo "🔧 Setting Feature Flag"
echo "------------------------"
echo "Setting NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED=true in Vercel..."
echo ""
echo -e "${YELLOW}Note: You must manually set this in Vercel Dashboard:${NC}"
echo "1. Go to: https://vercel.com/[team]/tabeza-customer/settings/environment-variables"
echo "2. Add: NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED = true (Production only)"
echo "3. Save"
echo ""
read -p "Have you set the feature flag in Vercel? (yes/no): " flag_set

if [ "$flag_set" != "yes" ]; then
    echo "Please set the feature flag first, then re-run this script."
    exit 0
fi

echo ""
echo "🚀 Deploying to Production"
echo "---------------------------"

# Deploy to production
echo "Running: vercel --prod"
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "📊 Next Steps:"
    echo "1. Monitor Vercel logs: vercel logs --prod"
    echo "2. Check Vercel Analytics: https://vercel.com/[team]/tabeza-customer/analytics"
    echo "3. Verify badge lookup API: curl https://app.tabeza.co.ke/api/loyalty/badge/[customer_id]"
    echo "4. Test on production: https://app.tabeza.co.ke/menu"
    echo "5. Monitor for 1 hour, then check again at 24-hour mark"
    echo ""
    echo "📖 Full monitoring guide: .kiro/specs/cross-venue-badge-persistence/PRODUCTION-DEPLOYMENT.md"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check Vercel logs for details: vercel logs --prod"
    exit 1
fi
