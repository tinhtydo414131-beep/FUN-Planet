# Plan: Angel AI Advanced Features - Re-evaluate, Appeal System, AI Analytics

## Overview
This plan implements 4 requested features for the Angel AI system:
1. **Re-evaluate All Games** button for games approved before AI was implemented
2. **Appeal System** allowing users to contest AI auto-rejections
3. **AI Analytics Dashboard** with comprehensive statistics
4. **Test Auto-Reject Flow** verification

---

## Current Status Analysis

| Feature | Status | Details |
|---------|--------|---------|
| Re-evaluate All Games | Partial | Only evaluates "approved + missing review". Need to include ALL games without AI review regardless of status |
| Appeal System | NOT IMPLEMENTED | No database table, no UI for users to submit appeals |
| AI Analytics Dashboard | Basic | Shows counts only. Missing: age distribution, top concerns, rejection rates |
| Auto-Reject Flow | IMPLEMENTED | Backend works, needs end-to-end testing |

---

## Phase 1: Database Schema Updates

### 1.1 Create `game_appeals` Table
```sql
CREATE TABLE game_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES uploaded_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE game_appeals ENABLE ROW LEVEL SECURITY;

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals" ON game_appeals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create appeals for their rejected games
CREATE POLICY "Users can create appeals" ON game_appeals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals" ON game_appeals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admins can update appeals
CREATE POLICY "Admins can update appeals" ON game_appeals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_appeals;
```

---

## Phase 2: Re-evaluate All Games Button

### 2.1 Update AdminAngelAITab.tsx
**File:** `src/components/admin/AdminAngelAITab.tsx`

**Changes:**
- Modify `loadGameStats()` to also count games that need re-evaluation (approved but no AI review)
- Add new state: `allGamesWithoutReview` - includes ALL games without AI review
- Add "Re-evaluate All Games" button that evaluates:
  - Approved games without AI review
  - Pending games without AI review (for preview)
- Keep existing "Đánh giá X game còn thiếu" for approved-only

**New UI Section:**
```
[Re-evaluate All Games] - Evaluates ALL games missing AI review
[Re-evaluate Approved Only] - Current behavior
```

---

## Phase 3: Appeal System Implementation

### 3.1 User-Facing Appeal Form
**File:** `src/pages/MyGames.tsx`

**Changes:**
- Add "Khiếu nại" (Appeal) button for rejected games
- Add Appeal Modal with:
  - Reason textarea (required, min 50 chars)
  - Submit button
  - Display appeal status if already submitted

**UI Flow:**
1. User sees rejected game with rejection note
2. User clicks "Khiếu nại" button
3. Modal opens with form
4. User submits reason
5. Status shows "Đang chờ duyệt" (Pending)

### 3.2 Admin Appeal Management
**File:** `src/components/admin/AdminAppealsTab.tsx` (NEW)

**Features:**
- Table of all pending appeals
- View game details and AI review
- View rejection reason
- View user's appeal reason
- Action buttons: Approve / Reject
- Response textarea for admin feedback
- Filter by status: All / Pending / Approved / Rejected

**On Approve:**
1. Set appeal status to 'approved'
2. Update game status to 'pending' (for manual re-review)
3. Send notification to user
4. Log admin action

**On Reject:**
1. Set appeal status to 'rejected'
2. Keep game as rejected
3. Send notification with admin response
4. Log admin action

### 3.3 Add Appeals Tab to Admin Dashboard
**File:** `src/pages/AdminMasterDashboard.tsx`

**Changes:**
- Add new tab "Appeals" between "Fraud" and "Settings"
- Import and render `AdminAppealsTab` component

---

## Phase 4: AI Analytics Dashboard

### 4.1 Enhanced Analytics Section
**File:** `src/components/admin/AdminAngelAITab.tsx`

**New Statistics:**
- Total games evaluated
- Auto-reject rate (%)
- Age rating distribution (Pie chart):
  - 3+, 6+, 9+, 12+
- Safety badge distribution (Bar chart):
  - Safe, Caution, Warning
- Top 5 concerns (list with counts)
- Average educational score
- Average violence score
- Games with gambling mechanics count
- Games with lootbox mechanics count

### 4.2 New Data Fetching
```typescript
interface AIAnalytics {
  totalEvaluated: number;
  autoRejectRate: number;
  ageDistribution: { age: string; count: number }[];
  safetyDistribution: { safety: string; count: number }[];
  topConcerns: { concern: string; count: number }[];
  avgEducationalScore: number;
  avgViolenceScore: number;
  gamblingCount: number;
  lootboxCount: number;
}
```

### 4.3 New Charts
- Pie Chart: Age Rating Distribution
- Bar Chart: Safety Badge Distribution
- Bar Chart: Top 5 Concerns
- Cards: Gambling/Lootbox counts

---

## Phase 5: Test Auto-Reject Flow

### 5.1 Create Test Game with Violating Content
**Manual Test Steps:**

1. Login as test user
2. Upload game with:
   - Title: "Súng bắn máu me 18+" (triggers violence keywords)
   - Description: "Casino gambling slot machine game"
   - Any thumbnail

3. **Expected Behavior:**
   - Edge function evaluates game
   - Violence score > 7 triggers auto-reject
   - Game status set to 'rejected'
   - `game_auto_rejected` notification sent
   - User sees notification in bell

4. **Verify in Admin:**
   - Game shows in rejected list
   - AI review shows auto_rejected = true
   - Admin can see rejection reasons

### 5.2 Add Test Panel (Development Only)
**File:** `src/components/admin/AdminAngelAITab.tsx`

**Add:**
```typescript
// Test panel (only in development)
{process.env.NODE_ENV === 'development' && (
  <Card>
    <CardHeader>
      <CardTitle>Test Auto-Reject Flow</CardTitle>
    </CardHeader>
    <CardContent>
      <Button onClick={createTestViolentGame}>
        Create Test Violent Game
      </Button>
    </CardContent>
  </Card>
)}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/AdminAngelAITab.tsx` | MODIFY | Add Re-evaluate All, enhanced analytics, test panel |
| `src/pages/MyGames.tsx` | MODIFY | Add Appeal button and modal |
| `src/components/admin/AdminAppealsTab.tsx` | CREATE | New admin tab for managing appeals |
| `src/pages/AdminMasterDashboard.tsx` | MODIFY | Add Appeals tab |
| Database migration | CREATE | Add game_appeals table with RLS |

---

## Critical Files for Implementation

1. **src/components/admin/AdminAngelAITab.tsx** - Main file for analytics and re-evaluate features
2. **src/pages/MyGames.tsx** - Add appeal UI for users
3. **src/components/admin/AdminAppealsTab.tsx** - New component for admin appeal management
4. **src/pages/AdminMasterDashboard.tsx** - Add Appeals tab to dashboard
5. **supabase/functions/angel-evaluate-game/index.ts** - Reference for auto-reject logic

---

## Implementation Order

1. Database migration (game_appeals table)
2. Re-evaluate All Games button (AdminAngelAITab.tsx)
3. User Appeal Form (MyGames.tsx)
4. Admin Appeals Tab (AdminAppealsTab.tsx + AdminMasterDashboard.tsx)
5. AI Analytics Dashboard enhancements
6. Test Auto-Reject flow verification

---

## Estimated Effort

- Phase 1 (Database): 1 migration
- Phase 2 (Re-evaluate): ~50 lines changed
- Phase 3 (Appeals): ~400 lines new code
- Phase 4 (Analytics): ~200 lines changed
- Phase 5 (Testing): Manual verification

Total: ~650 lines of code changes
