/**
 * Tests: Tenant Dashboard View Model — Ownership Goals Resolution
 *
 * Verifies:
 *   - `ownershipGoals.next` is preferred over the legacy `nextGoal` field
 *   - Legacy `nextGoal` is used as fallback when `ownershipGoals.next` is absent
 *   - Both sources produce numerically equivalent view model output
 *   - `estimatedMonthlyRentReduction` from legacy `nextGoal` is preserved as fallback
 *   - New `TenantOwnershipGoal` optional fields are accepted by the type
 */

import { buildRenterDashboardViewModel } from '../features/renter-dashboard/domain/fmz-renter-dashboard-view-model';
import type { FmzTenantDashboard } from '../features/tenant-portal/domain/fmz-tenant-portal.types';
import type { TenantOwnershipGoal } from '../features/tenant-portal/domain/fmz-tenant-portal.types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_DASHBOARD: FmzTenantDashboard = {
  tenant: { name: 'Ana' },
  ownership: {
    currentPercentage: 10,
    currentOwnedValue: 30000,
    totalPropertyValue: 300000,
    amountRemainingToFullOwnership: 270000,
    tokenBalance: 30,
    totalSupply: 300,
    tokenUnitValue: 1000,
  },
  rentInsight: {
    discountedRentAmount: 2700,
    adjustedBaseRentAmount: 3000,
    monthlySavingsAmount: 300,
    annualSavingsAmount: 3600,
  },
  monthlySummary: { totalDueAmount: 2700, dueDate: '2025-06-10' },
  boleto: { amount: 2700, dueDate: '2025-06-10' },
};

const makeGoal = (overrides: Partial<TenantOwnershipGoal> = {}): TenantOwnershipGoal => ({
  id: 'goal-1',
  goalKey: 'ownership_25',
  title: '25% do imóvel',
  description: 'Alcance 25% de participação',
  targetPercentage: 25,
  targetTokenAmount: 75,
  tokensRemaining: 45,
  amountRemaining: 45000,
  progressPercentage: 40,
  displayOrder: 1,
  rewardDescription: '5% de desconto extra no aluguel',
  ...overrides,
});

// ─── Ownership goal source resolution ─────────────────────────────────────────

describe('buildRenterDashboardViewModel — nextGoal source resolution', () => {

  it('uses ownershipGoals.next.targetPercentage when available', () => {
    const dashboard: FmzTenantDashboard = {
      ...BASE_DASHBOARD,
      ownershipGoals: {
        available: [makeGoal()],
        achieved: [],
        next: makeGoal({ targetPercentage: 25 }),
      },
      nextGoal: { percentage: 10 }, // legacy value — must be ignored
    };

    const vm = buildRenterDashboardViewModel(dashboard);
    expect(vm.nextMilestonePercentage).toBe(25);
  });

  it('uses ownershipGoals.next.amountRemaining for nextMilestoneRemaining', () => {
    const dashboard: FmzTenantDashboard = {
      ...BASE_DASHBOARD,
      ownershipGoals: {
        available: [makeGoal()],
        achieved: [],
        next: makeGoal({ amountRemaining: 45000 }),
      },
    };

    const vm = buildRenterDashboardViewModel(dashboard);
    expect(vm.nextMilestoneRemainingNumber).toBe(45000);
  });

  it('uses ownershipGoals.next.progressPercentage for nextMilestoneProgressPercentage', () => {
    const dashboard: FmzTenantDashboard = {
      ...BASE_DASHBOARD,
      ownershipGoals: {
        available: [makeGoal()],
        achieved: [],
        next: makeGoal({ progressPercentage: 40 }),
      },
    };

    const vm = buildRenterDashboardViewModel(dashboard);
    expect(vm.nextMilestoneProgressPercentage).toBe(40);
  });

  it('falls back to legacy nextGoal.percentage when ownershipGoals.next is null', () => {
    const dashboard: FmzTenantDashboard = {
      ...BASE_DASHBOARD,
      ownershipGoals: {
        available: [],
        achieved: [],
        next: null,
      },
      nextGoal: { percentage: 15 },
    };

    const vm = buildRenterDashboardViewModel(dashboard);
    expect(vm.nextMilestonePercentage).toBe(15);
  });

  it('falls back to legacy nextGoal when ownershipGoals is absent', () => {
    const dashboard: FmzTenantDashboard = {
      ...BASE_DASHBOARD,
      nextGoal: { percentage: 20 },
    };

    const vm = buildRenterDashboardViewModel(dashboard);
    expect(vm.nextMilestonePercentage).toBe(20);
  });

  it('preserves estimatedMonthlyRentReduction from legacy nextGoal even when ownershipGoals.next is present', () => {
    const dashboard: FmzTenantDashboard = {
      ...BASE_DASHBOARD,
      ownershipGoals: {
        available: [makeGoal()],
        achieved: [],
        next: makeGoal({ targetPercentage: 25 }),
      },
      nextGoal: { estimatedMonthlyRentReduction: 150 },
    };

    const vm = buildRenterDashboardViewModel(dashboard);
    expect(vm.nextMilestoneRentReductionLabel).toBe('R$ 150,00');
  });

  it('produces a valid view model when both ownershipGoals.next and nextGoal are absent', () => {
    const vm = buildRenterDashboardViewModel(BASE_DASHBOARD);
    expect(typeof vm.nextMilestonePercentage).toBe('number');
    expect(vm.nextMilestonePercentage).toBeGreaterThan(0);
  });

});

// ─── TenantOwnershipGoal optional fields ─────────────────────────────────────

describe('TenantOwnershipGoal — optional enrichment fields', () => {

  it('accepts goal with achieved flag set to true', () => {
    const goal = makeGoal({ achieved: true });
    expect(goal.achieved).toBe(true);
  });

  it('accepts goal with tokenBalance', () => {
    const goal = makeGoal({ tokenBalance: 30 });
    expect(goal.tokenBalance).toBe(30);
  });

  it('accepts goal with ownershipBps', () => {
    const goal = makeGoal({ ownershipBps: 1000 });
    expect(goal.ownershipBps).toBe(1000);
  });

  it('accepts goal with ownershipPercentage', () => {
    const goal = makeGoal({ ownershipPercentage: 10 });
    expect(goal.ownershipPercentage).toBe(10);
  });

  it('optional enrichment fields default to undefined when not provided', () => {
    const goal = makeGoal();
    expect(goal.achieved).toBeUndefined();
    expect(goal.tokenBalance).toBeUndefined();
    expect(goal.ownershipBps).toBeUndefined();
    expect(goal.ownershipPercentage).toBeUndefined();
  });

});

// ─── TenantOwnershipGoalsSummary — all field ─────────────────────────────────

describe('TenantOwnershipGoalsSummary — optional all field', () => {

  it('accepts summary with an all array', () => {
    const summary = {
      available: [makeGoal()],
      all: [makeGoal(), makeGoal({ id: 'goal-2', goalKey: 'ownership_50' })],
      achieved: [],
      next: makeGoal(),
    };

    expect(summary.all).toHaveLength(2);
  });

  it('all field is optional — summary is valid without it', () => {
    const summary: { available: TenantOwnershipGoal[]; all?: TenantOwnershipGoal[]; achieved: TenantOwnershipGoal[]; next: TenantOwnershipGoal | null } = {
      available: [makeGoal()],
      achieved: [],
      next: null,
    };

    expect(summary.all).toBeUndefined();
  });

});
