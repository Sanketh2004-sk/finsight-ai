// ============================================================
// tests/auth.test.js — Auth API Tests (Jest + Supertest)
// ============================================================

const request = require("supertest");
const app = require("../server");

describe("Auth API", () => {
  const testUser = {
    name: "Test User",
    email: `testuser_${Date.now()}@example.com`,
    password: "Test@1234",
  };

  let authToken = "";

  it("POST /api/auth/register — should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    authToken = res.body.token;
  });

  it("POST /api/auth/register — should reject duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it("POST /api/auth/login — should login with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it("POST /api/auth/login — should reject wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "WrongPassword123" })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it("GET /api/auth/profile — should return user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it("GET /api/auth/profile — should return 401 without token", async () => {
    await request(app).get("/api/auth/profile").expect(401);
  });

  it("GET /api/health — should return healthy status", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body.success).toBe(true);
  });
});
