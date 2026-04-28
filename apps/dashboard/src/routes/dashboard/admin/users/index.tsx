import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { USER_COLUMNS } from "@/components/dashboard/admin/users-columns";
import { UsersFilters } from "@/components/dashboard/admin/users-filters";
import { MOCK_USERS } from "@/components/dashboard/admin/users-mock";
import { UsersToolbar } from "@/components/dashboard/admin/users-toolbar";
import { DataTable } from "@/components/dashboard/data-table";

export const Route = createFileRoute("/dashboard/admin/users/")({
  component: UsersAllPage,
});

function UsersAllPage() {
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const onRefresh = async () => {
    setIsFetching(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setIsFetching(false);
  };

  const params = { search, roles, statuses, page, pageSize };

  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <p className="mt-1 text-sm text-muted-foreground">
        Active params: <code className="rounded bg-muted/60 px-1">{JSON.stringify(params)}</code>
      </p>

      <UsersToolbar
        isFetching={isFetching}
        onSearchChange={setSearch}
        onRefresh={onRefresh}
        search={search}
      />

      <UsersFilters
        onRolesChange={setRoles}
        onStatusesChange={setStatuses}
        roles={roles}
        statuses={statuses}
      />

      <DataTable
        columns={USER_COLUMNS}
        data={MOCK_USERS}
        getRowId={(u) => u.id}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        page={page}
        pageCount={12}
        pageSize={pageSize}
        totalCount={119}
      />
    </div>
  );
}
