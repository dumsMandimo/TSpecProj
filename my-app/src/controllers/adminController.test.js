// src/pages/admin/adminController.test.js
const { getDashboardStats } = require('./adminController');

describe('getDashboardStats', () => {

  // Helper to create a mock res object
  function mockRes() {
    return {
      json: jest.fn()
    };
  }

  // Helper to create a mock req object
  function mockReq() {
    return {};
  }

  test('returns correct total count', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ total: 4 })
    );
  });

  test('returns correct approved count', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ approved: 2 })
    );
  });

  test('returns correct pending count', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ pending: 2 })
    );
  });

  test('returns all three stats in a single response', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith({
      total: 4,
      approved: 2,
      pending: 2
    });
  });

  test('calls res.json exactly once', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('approved and pending counts add up to total', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.approved + result.pending).toBe(result.total);
  });

  test('returns numbers not strings for all values', () => {
    const req = mockReq();
    const res = mockRes();

    getDashboardStats(req, res);

    const result = res.json.mock.calls[0][0];
    expect(typeof result.total).toBe('number');
    expect(typeof result.approved).toBe('number');
    expect(typeof result.pending).toBe('number');
  });

});