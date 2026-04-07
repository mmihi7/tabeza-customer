#!/bin/bash
# Script to run the venue badge threshold bug condition exploration test

cd "$(dirname "$0")"
pnpm test __tests__/loyalty/venue-badge-threshold.test.ts
