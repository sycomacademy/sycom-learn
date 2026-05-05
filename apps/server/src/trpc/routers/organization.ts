import { listOrganizationMembershipsForUser } from "@sycom/db/queries/index";

import { protectedProcedure, router } from "../init";
import { organizationMembershipsOutputSchema } from "../schemas";

export const organizationRouter = router({
  memberships: protectedProcedure
    .output(organizationMembershipsOutputSchema)
    .query(async ({ ctx }) => {
      return listOrganizationMembershipsForUser(ctx.db, { userId: ctx.session.user.id });
    }),
});
