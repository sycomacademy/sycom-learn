import { relations, sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./_shared";
import { user } from "./auth";

export const profileSettingsDefault = {
  enableFacehash: true,
  marketingEmails: true,
  useDeviceTimezone: true,
} as const;

export interface ProfileSettings {
  enableFacehash?: boolean;
  marketingEmails?: boolean;
  useDeviceTimezone?: boolean;
}

export const profile = pgTable("profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  onboardedAt: timestamp("onboarded_at"),
  bio: text("bio").default(""),
  settings: jsonb("settings")
    .$type<ProfileSettings>()
    .default(sql`'{"useDeviceTimezone":true,"enableFacehash":true,"marketingEmails":true}'::jsonb`),
  createdAt,
  updatedAt,
});

export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
}));

export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
