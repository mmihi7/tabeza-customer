/**
 * Simplified M-Pesa End-to-End Integration Test
 * Task 8: End-to-end integration test
 * Requirements: 2.1, 2.5
 *
 * Tests complete flow: open tab → initiate payment → receive callback → tab closes
 * Tests callback idempotency (second callback does nothing)
 * Verifies integration with existing tab resolution system
 */
declare const originalEnv: NodeJS.ProcessEnv;
declare const mockFetch: jest.MockedFunction<typeof fetch>;
declare const mockSupabaseClient: {
    from: jest.Mock<{
        select: jest.Mock<{
            eq: jest.Mock<{
                single: jest.Mock<any, any, any>;
                limit: jest.Mock<any, any, any>;
                in: jest.Mock<{
                    limit: jest.Mock<any, any, any>;
                }, [], any>;
            }, [], any>;
            in: jest.Mock<{
                order: jest.Mock<{
                    limit: jest.Mock<any, any, any>;
                }, [], any>;
            }, [], any>;
        }, [], any>;
        insert: jest.Mock<{
            select: jest.Mock<{
                single: jest.Mock<any, any, any>;
            }, [], any>;
        }, [], any>;
        update: jest.Mock<{
            eq: jest.Mock<any, any, any>;
        }, [], any>;
    }, [], any>;
};
