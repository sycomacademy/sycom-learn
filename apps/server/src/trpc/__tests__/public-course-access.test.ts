import { describe, expect, test } from "bun:test";

import type { Context } from "../context";
import {
  canDeletePublicCourse,
  canReadPublicCourse,
  canUpdatePublicCourse,
} from "../lib/public-course-access";
import { testUser } from "./helpers";

const makeSession = (role?: string | null, userId?: string): NonNullable<Context["session"]> => {
  const now = new Date();
  const user = testUser({ id: userId, role });

  return {
    session: {
      id: `test-session-${user.id}`,
      token: `test-token-${user.id}`,
      userId: user.id,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      ipAddress: null,
      userAgent: null,
      activeOrganizationId: null,
      createdAt: now,
      updatedAt: now,
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: true,
      image: null,
      role,
      twoFactorEnabled: false,
      banned: false,
      banReason: null,
      banExpires: null,
      createdAt: now,
      updatedAt: now,
    },
  } as NonNullable<Context["session"]>;
};

const detail = {
  organizationId: null,
  createdBy: "creator-user",
  instructors: [
    {
      userId: "co-instructor",
      name: "Co Instructor",
      image: null,
      role: "secondary" as const,
      addedAt: new Date(),
    },
  ],
};

describe("public course access", () => {
  test("platform_admin can read update and delete any public course", () => {
    const session = makeSession("platform_admin", "admin-user");
    expect(canReadPublicCourse(session, detail)).toBe(true);
    expect(canUpdatePublicCourse(session, detail)).toBe(true);
    expect(canDeletePublicCourse(session, detail)).toBe(true);
  });

  test("public_student can read but not update or delete", () => {
    const session = makeSession("public_student", "student-user");
    expect(canReadPublicCourse(session, detail)).toBe(true);
    expect(canUpdatePublicCourse(session, detail)).toBe(false);
    expect(canDeletePublicCourse(session, detail)).toBe(false);
  });

  test("content_creator can access created courses", () => {
    const session = makeSession("content_creator", "creator-user");
    expect(canReadPublicCourse(session, detail)).toBe(true);
    expect(canUpdatePublicCourse(session, detail)).toBe(true);
    expect(canDeletePublicCourse(session, detail)).toBe(true);
  });

  test("content_creator can access co-instructed courses", () => {
    const session = makeSession("content_creator", "co-instructor");
    expect(canReadPublicCourse(session, detail)).toBe(true);
    expect(canUpdatePublicCourse(session, detail)).toBe(true);
    expect(canDeletePublicCourse(session, detail)).toBe(false);
  });

  test("content_creator main instructor can delete when not the recorded creator", () => {
    const mainInstructorDetail = {
      organizationId: null,
      createdBy: "original-creator",
      instructors: [
        {
          userId: "main-instructor",
          name: "Main",
          image: null,
          role: "main" as const,
          addedAt: new Date(),
        },
      ],
    };
    const session = makeSession("content_creator", "main-instructor");
    expect(canDeletePublicCourse(session, mainInstructorDetail)).toBe(true);
  });

  test("content_creator cannot access unrelated public course", () => {
    const session = makeSession("content_creator", "someone-else");
    expect(canReadPublicCourse(session, detail)).toBe(false);
    expect(canUpdatePublicCourse(session, detail)).toBe(false);
  });
});
