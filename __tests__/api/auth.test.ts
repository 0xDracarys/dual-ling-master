import { POST as RegisterPOST } from "@/app/api/auth/register/route";
import { POST as LoginPOST } from "@/app/api/auth/login/route";

// Mock Firebase Admin
jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn(() => ({
    createUser: jest.fn().mockImplementation((data) => {
      if (data.email === "duplicate@example.com") {
        throw { code: "auth/email-already-exists" };
      }
      return { uid: "test-uid-123", email: data.email };
    }),
    getUserByEmail: jest.fn().mockImplementation((email) => {
      if (email === "wrong@example.com") {
        throw { code: "auth/user-not-found" };
      }
      return { uid: "test-uid-123", email };
    }),
    createCustomToken: jest.fn().mockResolvedValue("mock-custom-token"),
  })),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn().mockImplementation((auth, email, password) => {
    if (password === "wrongpassword") {
      throw { code: "auth/wrong-password" };
    }
    return { user: { uid: "test-uid-123", email, getIdToken: () => "mock-id-token" } };
  }),
}));

// Mock Firestore
jest.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: "student" }),
        }),
      })),
    })),
  },
  adminAuth: {
    setCustomUserClaims: jest.fn().mockResolvedValue(true),
  },
}));

describe("Auth API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should return 201 on successful registration", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "newuser@example.com",
          password: "password123",
          username: "New User",
          role: "student",
        }),
      });

      const res = await RegisterPOST(req);
      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe("newuser@example.com");
    });

    it("should return 409 for duplicate email", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "duplicate@example.com",
          password: "password123",
          username: "Duplicate User",
          role: "student",
        }),
      });

      const res = await RegisterPOST(req);
      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 200 and token on correct credentials", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "correctpassword",
        }),
      });

      const res = await LoginPOST(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.token).toBe("mock-id-token");
    });

    it("should return 401 for wrong password", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "user@example.com",
          password: "wrongpassword",
        }),
      });

      const res = await LoginPOST(req);
      expect(res.status).toBe(401);
    });
  });
});
