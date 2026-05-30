import { GET as StatsGET } from "@/app/api/admin/stats/route";

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: jest.fn().mockImplementation((token) => {
      if (token === "admin-token") {
        return { uid: "admin-123", role: "admin" };
      }
      if (token === "student-token") {
        return { uid: "student-123", role: "student" };
      }
      throw new Error("Invalid token");
    }),
  },
  adminDb: {
    collection: jest.fn(() => ({
      count: () => ({ get: jest.fn().mockResolvedValue({ data: () => ({ count: 10 }) }) }),
      where: jest.fn().mockReturnThis(),
    })),
  },
}));

describe("Admin API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/admin/stats", () => {
    it("should return 401 if no token provided", async () => {
      const req = new Request("http://localhost:3000/api/admin/stats");
      const res = await StatsGET(req);
      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not an admin", async () => {
      const req = new Request("http://localhost:3000/api/admin/stats", {
        headers: { Authorization: "Bearer student-token" },
      });
      const res = await StatsGET(req);
      expect(res.status).toBe(403);
    });

    it("should return 200 with stats for admin", async () => {
      const req = new Request("http://localhost:3000/api/admin/stats", {
        headers: { Authorization: "Bearer admin-token" },
      });
      const res = await StatsGET(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.totalUsers).toBeDefined();
    });
  });
});
