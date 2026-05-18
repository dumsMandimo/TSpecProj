const request = require("supertest");
const express = require("express");

// Mock controller BEFORE importing route
jest.mock("../controllers/adminController", () => ({
  getDashboardStats: jest.fn((req, res) => {
    res.status(200).json({ success: true, message: "dashboard data" });
  }),
}));

const { getDashboardStats } = require("../controllers/adminController");
const adminRoutes = require("./adminRoutes");

describe("Admin Routes", () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/admin", adminRoutes);
  });

  test("GET /admin/dashboard should return 200", async () => {
    const res = await request(app).get("/admin/dashboard");

    expect(res.statusCode).toBe(200);
  });

  test("GET /admin/dashboard should call controller", async () => {
    await request(app).get("/admin/dashboard");

    expect(getDashboardStats).toHaveBeenCalledTimes(1);
  });

  test("GET /admin/dashboard should return expected response", async () => {
    const res = await request(app).get("/admin/dashboard");

    expect(res.body).toEqual({
      success: true,
      message: "dashboard data",
    });
  });
});