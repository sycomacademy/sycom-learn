import { afterEach, describe, expect, test } from "bun:test";
import { inArray } from "drizzle-orm";
import { member, organization, user } from "@sycom/db/schema/auth";
import { course } from "@sycom/db/schema/course";
import { storage } from "@sycom/db/schema/storage";

import { dbEnabled, makeCaller, testDb, testUser } from "./helpers";

describe("storage access — authorization without DB", () => {
  test("user cannot sign upload for another user's avatar", async () => {
    const actor = testUser();
    const target = testUser();
    const caller = makeCaller({ user: actor });

    await expect(
      caller.storage.signUpload({
        folder: "user_avatars",
        entityType: "user",
        entityId: target.id,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe.skipIf(!dbEnabled)("storage access — DB integration", () => {
  const createdUserIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdCourseIds: string[] = [];
  const createdStoragePublicIds: string[] = [];

  afterEach(async () => {
    if (createdStoragePublicIds.length) {
      await testDb.delete(storage).where(inArray(storage.publicId, createdStoragePublicIds));
      createdStoragePublicIds.length = 0;
    }
    if (createdCourseIds.length) {
      await testDb.delete(course).where(inArray(course.id, createdCourseIds));
      createdCourseIds.length = 0;
    }
    if (createdOrgIds.length) {
      await testDb.delete(member).where(inArray(member.organizationId, createdOrgIds));
      await testDb.delete(organization).where(inArray(organization.id, createdOrgIds));
      createdOrgIds.length = 0;
    }
    if (createdUserIds.length) {
      await testDb.delete(user).where(inArray(user.id, createdUserIds));
      createdUserIds.length = 0;
    }
  });

  async function seedOrgCourse() {
    const owner = testUser();
    const outsider = testUser();
    const orgId = `test-org-${crypto.randomUUID()}`;
    const courseId = `crs_${crypto.randomUUID()}`;
    createdUserIds.push(owner.id, outsider.id);
    createdOrgIds.push(orgId);
    createdCourseIds.push(courseId);

    await testDb.insert(user).values([
      { id: owner.id, email: owner.email, name: owner.name, emailVerified: true },
      { id: outsider.id, email: outsider.email, name: outsider.name, emailVerified: true },
    ]);
    await testDb.insert(organization).values({
      id: orgId,
      name: "Storage Test Org",
      slug: `storage-org-${crypto.randomUUID().slice(0, 8)}`,
    });
    await testDb.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      userId: owner.id,
      role: "owner",
    });
    await testDb.insert(course).values({
      id: courseId,
      organizationId: orgId,
      title: "Org Course",
      slug: `org-course-${crypto.randomUUID().slice(0, 8)}`,
      createdBy: owner.id,
    });

    return { owner, outsider, orgId, courseId };
  }

  async function insertUserAvatarAsset(input: {
    ownerId: string;
    ownerEmail: string;
    publicId: string;
  }) {
    createdStoragePublicIds.push(input.publicId);
    await testDb.insert(storage).values({
      publicId: input.publicId,
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/test.jpg",
      format: "jpg",
      bytes: 1024,
      folder: "user_avatars",
      resourceType: "image",
      entityType: "user",
      entityId: input.ownerId,
      uploadedBy: input.ownerId,
      uploaderEmail: input.ownerEmail,
    });
  }

  test("org owner can sign upload for org course thumbnail", async () => {
    const { owner, orgId, courseId } = await seedOrgCourse();
    const caller = makeCaller({ user: owner, activeOrganizationId: orgId });

    const result = await caller.storage.signUpload({
      folder: "course_thumbnails",
      entityType: "course",
      entityId: courseId,
    });

    expect(result.publicId).toContain(courseId);
  });

  test("non-member cannot sign upload for org course", async () => {
    const { outsider, courseId } = await seedOrgCourse();
    const caller = makeCaller({ user: outsider });

    await expect(
      caller.storage.signUpload({
        folder: "course_thumbnails",
        entityType: "course",
        entityId: courseId,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("user cannot get signed download URL for another user's avatar", async () => {
    const owner = testUser();
    const intruder = testUser();
    createdUserIds.push(owner.id, intruder.id);
    await testDb.insert(user).values([
      { id: owner.id, email: owner.email, name: owner.name, emailVerified: true },
      { id: intruder.id, email: intruder.email, name: intruder.name, emailVerified: true },
    ]);

    const publicId = `sycom-lms/user_avatars/${owner.id}/avatar-file`;
    await insertUserAvatarAsset({
      ownerId: owner.id,
      ownerEmail: owner.email,
      publicId,
    });

    const caller = makeCaller({ user: intruder });
    await expect(
      caller.storage.getSignedDownloadUrl({
        publicId,
        expireIn: 120,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("saveAsset rejects overwrite when existing asset owned by another user", async () => {
    const owner = testUser();
    const intruder = testUser();
    createdUserIds.push(owner.id, intruder.id);
    await testDb.insert(user).values([
      { id: owner.id, email: owner.email, name: owner.name, emailVerified: true },
      { id: intruder.id, email: intruder.email, name: intruder.name, emailVerified: true },
    ]);

    const publicId = `sycom-lms/user_avatars/${owner.id}/shared-avatar`;
    await insertUserAvatarAsset({
      ownerId: owner.id,
      ownerEmail: owner.email,
      publicId,
    });

    const caller = makeCaller({ user: intruder });
    await expect(
      caller.storage.saveAsset({
        publicId,
        secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/overwritten.jpg",
        folder: "user_avatars",
        entityType: "user",
        entityId: intruder.id,
        resourceType: "image",
        format: "jpg",
        bytes: 2048,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
