# Cross-Venue Badge Display Test - File Index

## 📂 Directory Structure

```
.kiro/specs/cross-venue-badge-persistence/
├── INDEX.md                          ← You are here
├── QUICK-START.md                    ← Start here for fast execution
├── TEST-SUMMARY.md                   ← Overview and metrics
├── TEST-CHECKLIST.md                 ← Step-by-step execution guide
├── TEST-README.md                    ← Complete execution guide
├── test-cross-venue-badge.md         ← Detailed test plan
├── test-setup.sql                    ← Generic setup script (template)
├── test-setup-ready.sql              ← Ready-to-use setup (with real IDs)
├── verify-cross-venue-test.sh        ← Automated verification (Linux/Mac)
├── verify-cross-venue-test.bat       ← Automated verification (Windows)
├── requirements.md                   ← Feature requirements
├── design.md                         ← Feature design document
└── tasks.md                          ← Implementation tasks
```

---

## 🎯 Which File Should I Use?

### I want to run the test quickly (5-10 min)
→ **Start with**: `QUICK-START.md`  
→ **Then run**: `test-setup-ready.sql`  
→ **Then test**: Follow 3-step guide in QUICK-START

### I want detailed step-by-step instructions
→ **Start with**: `TEST-CHECKLIST.md`  
→ **Reference**: `TEST-README.md` for troubleshooting  
→ **Use**: Checklist to document results

### I want to understand the test thoroughly
→ **Read**: `TEST-SUMMARY.md` (overview)  
→ **Read**: `test-cross-venue-badge.md` (detailed plan)  
→ **Read**: `TEST-README.md` (execution guide)

### I want automated testing
→ **Linux/Mac**: `verify-cross-venue-test.sh`  
→ **Windows**: `verify-cross-venue-test.bat`  
→ **Setup**: Set environment variables first

### I want to understand the feature
→ **Read**: `requirements.md` (what we're building)  
→ **Read**: `design.md` (how it works)  
→ **Read**: `tasks.md` (implementation plan)

---

## 📋 File Descriptions

### Quick Reference Files

#### QUICK-START.md
- **Purpose**: Get testing in 5-10 minutes
- **Contains**: 3-step setup, actual IDs, quick verification
- **Use when**: You want to run the test immediately
- **Length**: 2 pages

#### TEST-SUMMARY.md
- **Purpose**: Overview of test scope and metrics
- **Contains**: Test coverage, success criteria, time estimates
- **Use when**: You need a high-level understanding
- **Length**: 3 pages

#### INDEX.md (This File)
- **Purpose**: Navigate all test materials
- **Contains**: File descriptions, decision tree
- **Use when**: You're not sure which file to use
- **Length**: 2 pages

---

### Execution Guides

#### TEST-CHECKLIST.md
- **Purpose**: Step-by-step execution with checkboxes
- **Contains**: Detailed steps, verification points, sign-off
- **Use when**: You want to document test execution
- **Length**: 6 pages
- **Format**: Printable checklist

#### TEST-README.md
- **Purpose**: Complete execution guide with troubleshooting
- **Contains**: Prerequisites, steps, API examples, debug commands
- **Use when**: You need comprehensive guidance
- **Length**: 8 pages

#### test-cross-venue-badge.md
- **Purpose**: Detailed test plan with all scenarios
- **Contains**: Test objective, phases, verification, edge cases
- **Use when**: You need full test documentation
- **Length**: 10 pages

---

### Setup Scripts

#### test-setup-ready.sql
- **Purpose**: Database setup with REAL IDs from your system
- **Contains**: Pre-filled customer/venue IDs, discount settings
- **Use when**: You want to run setup immediately
- **Format**: SQL script for Supabase
- **Ready to use**: ✅ YES

#### test-setup.sql
- **Purpose**: Generic template with placeholders
- **Contains**: Same as above but with `<placeholder>` IDs
- **Use when**: You want to customize for different customers/venues
- **Format**: SQL script template
- **Ready to use**: ❌ NO (needs ID replacement)

---

### Verification Scripts

#### verify-cross-venue-test.sh
- **Purpose**: Automated API testing (Linux/Mac)
- **Contains**: curl commands, JSON parsing, pass/fail checks
- **Use when**: You want automated verification
- **Prerequisites**: curl, jq (optional)
- **Platform**: Linux, macOS, WSL

#### verify-cross-venue-test.bat
- **Purpose**: Automated API testing (Windows)
- **Contains**: curl commands, basic parsing, pass/fail checks
- **Use when**: You want automated verification on Windows
- **Prerequisites**: curl
- **Platform**: Windows CMD

---

### Specification Documents

#### requirements.md
- **Purpose**: Feature requirements and acceptance criteria
- **Contains**: User stories, requirements, glossary
- **Use when**: You need to understand what we're building
- **Length**: 15 pages

#### design.md
- **Purpose**: Technical design and architecture
- **Contains**: Data flows, API routes, components, edge cases
- **Use when**: You need to understand how it works
- **Length**: 50+ pages

#### tasks.md
- **Purpose**: Implementation task list
- **Contains**: Phased tasks, checkpoints, dependencies
- **Use when**: You're implementing or tracking progress
- **Length**: 20 pages

---

## 🚀 Recommended Workflows

### Workflow 1: First-Time Tester
```
1. Read: INDEX.md (this file)
2. Read: QUICK-START.md
3. Run: test-setup-ready.sql
4. Follow: QUICK-START 3-step guide
5. Document: Use TEST-CHECKLIST.md
```

### Workflow 2: Experienced Tester
```
1. Run: test-setup-ready.sql
2. Run: verify-cross-venue-test.sh (or .bat)
3. Review: Output for pass/fail
4. Debug: Use TEST-README.md if issues
```

### Workflow 3: Developer Understanding Feature
```
1. Read: TEST-SUMMARY.md
2. Read: requirements.md (Req 3.2, 3.3, 7.1, 7.2)
3. Read: design.md (Edge Cases section)
4. Run: test-setup-ready.sql
5. Test: Follow QUICK-START.md
```

### Workflow 4: QA Documentation
```
1. Read: test-cross-venue-badge.md
2. Use: TEST-CHECKLIST.md for execution
3. Document: Fill in checklist as you test
4. Reference: TEST-README.md for troubleshooting
5. Report: Use checklist as test report
```

---

## 🔍 Quick Search

### I need to find...

**Actual customer IDs**  
→ `QUICK-START.md` or `test-setup-ready.sql`

**Actual venue IDs**  
→ `QUICK-START.md` or `test-setup-ready.sql`

**API endpoint examples**  
→ `TEST-README.md` or `test-cross-venue-badge.md`

**Database queries**  
→ `test-setup-ready.sql` or `TEST-README.md`

**Success criteria**  
→ `TEST-SUMMARY.md` or `TEST-CHECKLIST.md`

**Troubleshooting steps**  
→ `TEST-README.md`

**Expected API responses**  
→ `QUICK-START.md` or `test-cross-venue-badge.md`

**Discount calculation formula**  
→ `test-cross-venue-badge.md` or `requirements.md`

**Edge cases**  
→ `design.md` or `test-cross-venue-badge.md`

**Time estimates**  
→ `TEST-SUMMARY.md`

---

## 📊 File Comparison

| Feature | QUICK-START | TEST-CHECKLIST | TEST-README | test-cross-venue-badge |
|---------|-------------|----------------|-------------|------------------------|
| Length | Short (2 pg) | Medium (6 pg) | Long (8 pg) | Very Long (10 pg) |
| Detail Level | High-level | Step-by-step | Comprehensive | Exhaustive |
| Real IDs | ✅ Yes | ✅ Yes | ❌ Placeholders | ❌ Placeholders |
| Printable | ✅ Yes | ✅ Yes | ⚠️ Long | ⚠️ Very Long |
| Checkboxes | ❌ No | ✅ Yes | ❌ No | ❌ No |
| Troubleshooting | ⚠️ Basic | ⚠️ Basic | ✅ Extensive | ✅ Extensive |
| API Examples | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| SQL Queries | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| Best For | Quick test | Documentation | Learning | Reference |

---

## 🎯 Test Execution Decision Tree

```
START
  │
  ├─ Need to run test quickly?
  │   └─ YES → Use QUICK-START.md
  │
  ├─ Need to document execution?
  │   └─ YES → Use TEST-CHECKLIST.md
  │
  ├─ Want automated testing?
  │   └─ YES → Use verify-cross-venue-test.sh/.bat
  │
  ├─ Encountering issues?
  │   └─ YES → Use TEST-README.md (troubleshooting)
  │
  ├─ Need to understand feature?
  │   └─ YES → Read TEST-SUMMARY.md → requirements.md → design.md
  │
  └─ Need complete test plan?
      └─ YES → Use test-cross-venue-badge.md
```

---

## 📞 Getting Help

### If you're stuck...

1. **Check**: `TEST-README.md` troubleshooting section
2. **Review**: `test-cross-venue-badge.md` for detailed steps
3. **Verify**: Database state with SQL queries in `test-setup-ready.sql`
4. **Test**: API endpoints with curl commands in `QUICK-START.md`
5. **Debug**: Browser console and React DevTools

### If you find issues...

1. **Document**: In `TEST-CHECKLIST.md` issues section
2. **Report**: Include test ID, phase, and actual vs expected
3. **Attach**: Screenshots, API responses, database queries

---

## ✅ Test Status

- **Setup**: ✅ Complete (all files created)
- **Documentation**: ✅ Complete (8 test files)
- **Ready to Execute**: ✅ YES
- **Estimated Time**: 15-20 minutes
- **Prerequisites**: ✅ Met (dev server, database access)

---

## 📝 Notes

- All files use actual IDs from your system where applicable
- Test customer: `146d955e-44fe-4e22-8c27-f412b5911c41`
- Popos venue: `438c80c1-fe11-4ac5-8a48-2fc45104ba31`
- Bar venue: `94044336-927f-42ec-9d11-2026ed8a1bc9`
- Files are ready to use without modification

---

**Last Updated**: 2026-04-07  
**Status**: Ready for Execution  
**Test ID**: 13
