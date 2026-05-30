import { POST as TeacherBotPOST } from "@/app/api/ai/teacher-bot/route";

jest.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: jest.fn().mockImplementation((token) => {
      if (token === "valid-token") {
        return { uid: "teacher-123", role: "teacher" };
      }
      if (token === "student-token") {
        return { uid: "student-123", role: "student" };
      }
      throw new Error("Invalid token");
    }),
  },
}));

jest.mock("@/lib/firebase/ai", () => ({
  generateTeacherResponse: jest.fn().mockResolvedValue({
    text: "Hello, I am your AI assistant.",
    type: "text",
  }),
}));

describe("AI TeacherBot API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if no auth token is provided", async () => {
    const req = new Request("http://localhost:3000/api/ai/teacher-bot", {
      method: "POST",
      body: JSON.stringify({ message: "Hello", history: [] }),
    });

    const res = await TeacherBotPOST(req);
    expect(res.status).toBe(401);
  });

  it("should return 403 if user is not a teacher", async () => {
    const req = new Request("http://localhost:3000/api/ai/teacher-bot", {
      method: "POST",
      headers: { Authorization: "Bearer student-token" },
      body: JSON.stringify({ message: "Hello", history: [] }),
    });

    const res = await TeacherBotPOST(req);
    expect(res.status).toBe(403);
  });

  it("should return 200 with AI response for valid teacher request", async () => {
    const req = new Request("http://localhost:3000/api/ai/teacher-bot", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
      body: JSON.stringify({ message: "Hello", history: [] }),
    });

    const res = await TeacherBotPOST(req);
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.response.text).toBe("Hello, I am your AI assistant.");
    expect(data.data.response.type).toBe("text");
  });
});
