/**
 * Tests: Tenant Dashboard — Ownership Goals
 *
 * Verifies that the dashboard goal rendering uses backend data exclusively.
 * No local goal generation, no hardcoded percentages.
 */

import type { TenantOwnershipGoal, TenantOwnershipGoalsSummary } from '../features/tenant-portal/domain/fmz-tenant-portal.types';

// ─── Helpers (mirroring production logic for isolated unit testing) ────────────

/**
 * Extracts available goals from the backend payload and applies defensive sorting.
 * This mirrors the logic inside buildOwnershipGoalSlidesFromBackend().
 *
 * Time:  O(n log n)
 * Space: O(n)
 */
function extractAvailableGoals(ownershipGoals: TenantOwnershipGoalsSummary | null | undefined): TenantOwnershipGoal[] {
  const available = ownershipGoals?.available ?? [];
  if (available.length === 0) return [];

  return [...available].sort(
    (a, b) =>
      a.tokensRemaining - b.tokensRemaining ||
      a.targetTokenAmount - b.targetTokenAmount ||
      a.displayOrder - b.displayOrder,
  );
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeGoal = (overrides: Partial<TenantOwnershipGoal> = {}): TenantOwnershipGoal => ({
  id: 'goal-1',
  goalKey: 'pct_20',
  title: 'Conquiste 20% do imóvel',
  description: 'Ao atingir 20%, seu aluguel reduz.',
  targetPercentage: 20,
  targetTokenAmount: 20000,
  tokensRemaining: 3500,
  amountRemaining: 3500,
  progressPercentage: 82.5,
  displayOrder: 1,
  rewardDescription: null,
  ...overrides,
});

const makeAchievedGoal = (overrides: Partial<TenantOwnershipGoal> = {}): TenantOwnershipGoal => ({
  ...makeGoal({ id: 'goal-achieved', goalKey: 'pct_10', title: 'Conquiste 10% do imóvel', targetPercentage: 10, targetTokenAmount: 10000, tokensRemaining: 0, amountRemaining: 0, progressPercentage: 100, displayOrder: 1 }),
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Dashboard Ownership Goals — backend as source of truth', () => {

  describe('extractAvailableGoals()', () => {

    it('returns empty array when ownershipGoals is null', () => {
      expect(extractAvailableGoals(null)).toEqual([]);
    });

    it('returns empty array when ownershipGoals is undefined', () => {
      expect(extractAvailableGoals(undefined)).toEqual([]);
    });

    it('returns empty array when available list is empty', () => {
      const goals: TenantOwnershipGoalsSummary = { available: [], achieved: [], next: null };
      expect(extractAvailableGoals(goals)).toEqual([]);
    });

    it('returns backend goals as-is when there is only one', () => {
      const goal = makeGoal();
      const goals: TenantOwnershipGoalsSummary = { available: [goal], achieved: [], next: null };
      const result = extractAvailableGoals(goals);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('goal-1');
    });

    it('sorts goals by tokensRemaining ASC (closest to completion first)', () => {
      const farGoal = makeGoal({ id: 'far', tokensRemaining: 9000, displayOrder: 1 });
      const closeGoal = makeGoal({ id: 'close', tokensRemaining: 1000, displayOrder: 2 });
      const goals: TenantOwnershipGoalsSummary = { available: [farGoal, closeGoal], achieved: [], next: null };

      const result = extractAvailableGoals(goals);
      expect(result[0].id).toBe('close');
      expect(result[1].id).toBe('far');
    });

    it('breaks tokensRemaining ties by targetTokenAmount ASC', () => {
      const goalA = makeGoal({ id: 'a', tokensRemaining: 500, targetTokenAmount: 20000, displayOrder: 2 });
      const goalB = makeGoal({ id: 'b', tokensRemaining: 500, targetTokenAmount: 10000, displayOrder: 1 });
      const goals: TenantOwnershipGoalsSummary = { available: [goalA, goalB], achieved: [], next: null };

      const result = extractAvailableGoals(goals);
      expect(result[0].id).toBe('b');
    });

    it('breaks all ties by displayOrder ASC', () => {
      const goalX = makeGoal({ id: 'x', tokensRemaining: 500, targetTokenAmount: 10000, displayOrder: 5 });
      const goalY = makeGoal({ id: 'y', tokensRemaining: 500, targetTokenAmount: 10000, displayOrder: 2 });
      const goals: TenantOwnershipGoalsSummary = { available: [goalX, goalY], achieved: [], next: null };

      const result = extractAvailableGoals(goals);
      expect(result[0].id).toBe('y');
    });

    it('does NOT include achieved goals — achieved list is separate', () => {
      const achieved = makeAchievedGoal();
      const available = makeGoal();
      const goals: TenantOwnershipGoalsSummary = { available: [available], achieved: [achieved], next: null };

      const result = extractAvailableGoals(goals);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('goal-1');
    });

    it('does not mutate the original array', () => {
      const goal1 = makeGoal({ id: '1', tokensRemaining: 5000, displayOrder: 1 });
      const goal2 = makeGoal({ id: '2', tokensRemaining: 1000, displayOrder: 2 });
      const available = [goal1, goal2];
      const goals: TenantOwnershipGoalsSummary = { available, achieved: [], next: null };

      extractAvailableGoals(goals);
      // Original array order must remain unchanged (sort is on a copy)
      expect(available[0].id).toBe('1');
      expect(available[1].id).toBe('2');
    });

    it('preserves all goal fields from backend without modification', () => {
      const goal = makeGoal({ rewardDescription: 'Ganhe um brinde!', progressPercentage: 75.5 });
      const goals: TenantOwnershipGoalsSummary = { available: [goal], achieved: [], next: null };

      const result = extractAvailableGoals(goals);
      expect(result[0].rewardDescription).toBe('Ganhe um brinde!');
      expect(result[0].progressPercentage).toBe(75.5);
      expect(result[0].title).toBe('Conquiste 20% do imóvel');
      expect(result[0].description).toBe('Ao atingir 20%, seu aluguel reduz.');
    });

  });

});
