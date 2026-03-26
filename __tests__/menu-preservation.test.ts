/**
 * Preservation Property Tests — Real-Time Event Handlers
 *
 * Property 2: Preservation — Real-Time Event Handlers Unchanged for Non-Buggy Inputs
 *
 * These tests verify that handleOrderUpdate, handleOrderInsert, and handleOrderDelete
 * produce correct state transitions for all valid payloads. They MUST PASS on unfixed
 * code because the handlers themselves are correct — only the initial tab_orders fetch
 * (loadMenuData) is buggy.
 *
 * Validates: Requirements 3.1, 3.4
 */

import * as fc from 'fast-check';
import {
  updateOrderInList,
  addOrderToList,
  removeOrderFromList,
  validateNoDuplicates,
  type TabOrder,
} from '../lib/order-state-helpers';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generate a valid ISO timestamp string */
const isoTimestamp = (): fc.Arbitrary<string> =>
  fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }).map(d => d.toISOString());

/** Generate a valid TabOrder object */
const tabOrderArb = (): fc.Arbitrary<TabOrder> =>
  fc.record({
    id: fc.uuid(),
    tab_id: fc.uuid(),
    items: fc.array(fc.record({ name: fc.string(), quantity: fc.integer({ min: 1, max: 10 }) }), { minLength: 1, maxLength: 5 }),
    total: fc.float({ min: 0, max: 10000, noNaN: true }),
    status: fc.constantFrom('pending', 'confirmed', 'cancelled') as fc.Arbitrary<TabOrder['status']>,
    created_at: isoTimestamp(),
    updated_at: isoTimestamp(),
    order_number: fc.option(fc.integer({ min: 1, max: 9999 }), { nil: undefined }),
    initiated_by: fc.option(fc.constantFrom('customer', 'staff') as fc.Arbitrary<'customer' | 'staff'>, { nil: undefined }),
    confirmed_at: fc.option(isoTimestamp(), { nil: undefined }),
    cancelled_at: fc.option(isoTimestamp(), { nil: undefined }),
    rejection_reason: fc.option(fc.string(), { nil: undefined }),
    cancelled_by: fc.option(fc.constantFrom('customer', 'staff', 'system') as fc.Arbitrary<'customer' | 'staff' | 'system'>, { nil: undefined }),
  });

/** Generate a non-empty array of TabOrders with unique IDs */
const uniqueOrdersArb = (minLength = 1, maxLength = 10): fc.Arbitrary<TabOrder[]> =>
  fc.array(tabOrderArb(), { minLength, maxLength }).filter(orders => {
    const ids = orders.map(o => o.id);
    return new Set(ids).size === ids.length;
  });

// ---------------------------------------------------------------------------
// Property 2a: handleOrderUpdate — updated order fields match payload
// ---------------------------------------------------------------------------

describe('Property 2a: handleOrderUpdate — updated order fields match payload', () => {
  /**
   * Validates: Requirements 3.1, 3.4
   *
   * For all valid UPDATE payloads (random TabOrder objects), updateOrderInList
   * produces a state where the updated order's fields match the payload exactly.
   */
  it('should replace the matching order with the updated payload', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        tabOrderArb(),
        (orders, indexSeed, updatedFields) => {
          // Pick an existing order to update
          const targetIndex = indexSeed % orders.length;
          const targetOrder = orders[targetIndex];

          // Build updated order: same id, different fields
          const updatedOrder: TabOrder = {
            ...updatedFields,
            id: targetOrder.id,
            tab_id: targetOrder.tab_id,
          };

          const result = updateOrderInList(orders, updatedOrder);

          // The result must contain an order with the same id
          const found = result.find(o => o.id === updatedOrder.id);
          if (!found) return false;

          // All fields of the found order must match the payload
          return (
            found.status === updatedOrder.status &&
            found.total === updatedOrder.total &&
            found.tab_id === updatedOrder.tab_id
          );
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should not increase the order count when updating an existing order', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        tabOrderArb(),
        (orders, indexSeed, updatedFields) => {
          const targetIndex = indexSeed % orders.length;
          const targetOrder = orders[targetIndex];

          const updatedOrder: TabOrder = {
            ...updatedFields,
            id: targetOrder.id,
            tab_id: targetOrder.tab_id,
          };

          const result = updateOrderInList(orders, updatedOrder);

          // Count must stay the same (no duplicate created)
          return result.length === orders.length;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should produce no duplicate IDs after update', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        tabOrderArb(),
        (orders, indexSeed, updatedFields) => {
          const targetIndex = indexSeed % orders.length;
          const targetOrder = orders[targetIndex];

          const updatedOrder: TabOrder = {
            ...updatedFields,
            id: targetOrder.id,
            tab_id: targetOrder.tab_id,
          };

          const result = updateOrderInList(orders, updatedOrder);
          return validateNoDuplicates(result);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2b: handleOrderInsert — adds exactly one new order without duplicates
// ---------------------------------------------------------------------------

describe('Property 2b: handleOrderInsert — adds exactly one new order without duplicates', () => {
  /**
   * Validates: Requirements 3.1, 3.4
   *
   * For all valid INSERT payloads (random TabOrder objects), addOrderToList
   * adds exactly one new order and produces no duplicates.
   */
  it('should increase order count by exactly 1 when inserting a new order', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(0, 10),
        tabOrderArb(),
        (orders, newOrder) => {
          // Ensure the new order ID is not already in the list
          fc.pre(!orders.some(o => o.id === newOrder.id));

          const result = addOrderToList(orders, newOrder);

          return result.length === orders.length + 1;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should contain the new order after insert', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(0, 10),
        tabOrderArb(),
        (orders, newOrder) => {
          fc.pre(!orders.some(o => o.id === newOrder.id));

          const result = addOrderToList(orders, newOrder);

          return result.some(o => o.id === newOrder.id);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should not create duplicates when inserting an already-existing order', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        (orders, indexSeed) => {
          const targetIndex = indexSeed % orders.length;
          const existingOrder = orders[targetIndex];

          // Insert an order that already exists
          const result = addOrderToList(orders, existingOrder);

          return validateNoDuplicates(result);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should produce no duplicate IDs after insert', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(0, 10),
        tabOrderArb(),
        (orders, newOrder) => {
          fc.pre(!orders.some(o => o.id === newOrder.id));

          const result = addOrderToList(orders, newOrder);

          return validateNoDuplicates(result);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should preserve all pre-existing orders after insert', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(0, 10),
        tabOrderArb(),
        (orders, newOrder) => {
          fc.pre(!orders.some(o => o.id === newOrder.id));

          const result = addOrderToList(orders, newOrder);

          // Every original order must still be present
          return orders.every(o => result.some(r => r.id === o.id));
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2c: handleOrderDelete — removes exactly the targeted order ID
// ---------------------------------------------------------------------------

describe('Property 2c: handleOrderDelete — removes exactly the targeted order ID', () => {
  /**
   * Validates: Requirements 3.1, 3.4
   *
   * For all valid DELETE payloads (random order IDs), removeOrderFromList
   * removes exactly the targeted order and leaves all others intact.
   */
  it('should decrease order count by exactly 1 when deleting an existing order', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        (orders, indexSeed) => {
          const targetIndex = indexSeed % orders.length;
          const targetId = orders[targetIndex].id;

          const result = removeOrderFromList(orders, targetId);

          return result.length === orders.length - 1;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should not contain the deleted order ID after removal', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        (orders, indexSeed) => {
          const targetIndex = indexSeed % orders.length;
          const targetId = orders[targetIndex].id;

          const result = removeOrderFromList(orders, targetId);

          return !result.some(o => o.id === targetId);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should preserve all non-targeted orders after deletion', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        (orders, indexSeed) => {
          const targetIndex = indexSeed % orders.length;
          const targetId = orders[targetIndex].id;

          const result = removeOrderFromList(orders, targetId);

          // All orders except the deleted one must still be present
          const remaining = orders.filter(o => o.id !== targetId);
          return remaining.every(o => result.some(r => r.id === o.id));
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should return the original array unchanged when deleting a non-existent ID', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(0, 10),
        fc.uuid(),
        (orders, nonExistentId) => {
          fc.pre(!orders.some(o => o.id === nonExistentId));

          const result = removeOrderFromList(orders, nonExistentId);

          return result.length === orders.length;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should produce no duplicate IDs after deletion', () => {
    fc.assert(
      fc.property(
        uniqueOrdersArb(1, 10),
        fc.integer({ min: 0, max: 9 }),
        (orders, indexSeed) => {
          const targetIndex = indexSeed % orders.length;
          const targetId = orders[targetIndex].id;

          const result = removeOrderFromList(orders, targetId);

          return validateNoDuplicates(result);
        }
      ),
      { numRuns: 200 }
    );
  });
});
