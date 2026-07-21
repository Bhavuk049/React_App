import { Link } from "react-router-dom";
import { useAdminListUsersQuery } from "../../store/api/usersApi.js";

export function AdminUsersPage() {
  const { data: users = [] } = useAdminListUsersQuery();

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Users</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Addresses</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-3 text-neutral-500">{u.email}</td>
                <td className="px-4 py-3 text-neutral-500">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.emailVerifiedAt ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-neutral-400">No</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500">{u._count.addresses}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(u.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/users/${u.id}`} className="font-medium text-neutral-600 hover:text-neutral-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
