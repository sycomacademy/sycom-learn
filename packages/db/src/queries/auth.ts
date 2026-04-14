import { and, eq } from "drizzle-orm";

import { db, type Database } from "..";
import {
  member,
  organization,
  session,
  user,
  type Member,
  type Organization,
  type Session,
  type User,
} from "../schema/auth";

export async function getUserById(id: string, database: Database = db): Promise<User | undefined> {
  const [row] = await database.select().from(user).where(eq(user.id, id));
  return row;
}

export async function getUserByEmail(
  email: string,
  database: Database = db,
): Promise<User | undefined> {
  const [row] = await database.select().from(user).where(eq(user.email, email));
  return row;
}

export async function getSessionByToken(
  token: string,
  database: Database = db,
): Promise<Session | undefined> {
  const [row] = await database.select().from(session).where(eq(session.token, token));
  return row;
}

export async function getOrganizationBySlug(
  slug: string,
  database: Database = db,
): Promise<Organization | undefined> {
  const [row] = await database.select().from(organization).where(eq(organization.slug, slug));
  return row;
}

export async function getOrgMember(
  input: { organizationId: string; userId: string },
  database: Database = db,
): Promise<Member | undefined> {
  const [row] = await database
    .select()
    .from(member)
    .where(and(eq(member.organizationId, input.organizationId), eq(member.userId, input.userId)));
  return row;
}

export async function listOrgMembers(
  organizationId: string,
  database: Database = db,
): Promise<Member[]> {
  return database.select().from(member).where(eq(member.organizationId, organizationId));
}
