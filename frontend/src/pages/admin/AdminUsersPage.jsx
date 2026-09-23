import React, { useEffect, useState } from "react";
import { Users, Search, Shield, UserCheck, UserX } from "lucide-react";
import { authApi } from "../../services/authApi";
import { formatDate } from "../../utils/formatters";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Select from "../../components/common/Select";
import Spinner from "../../components/common/Spinner";
import Pagination from "../../components/common/Pagination";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../hooks/useToast";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [updatingId, setUpdatingId] = useState(null);

  const { showSuccess, showError } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers({
        page,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });
      const data = res?.data || res;
      setUsers(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / 20) || 1);
    } catch (err) {
      showError("Failed to fetch user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleToggleActive = async (userObj) => {
    const newStatus = !userObj.is_active;
    setUpdatingId(userObj.id);
    try {
      await authApi.updateUser(userObj.id, { is_active: newStatus });
      showSuccess(`User "${userObj.full_name}" is now ${newStatus ? "Active" : "Inactive"}.`);
      fetchUsers();
    } catch (err) {
      showError("Failed to update user status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await authApi.updateUser(userId, { role: newRole });
      showSuccess(`User role updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      showError("Failed to change user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            User Accounts & Roles
          </h1>
          <p className="text-xs text-slate-500">
            View registered customers, staff members, and system administrators.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            placeholder="Search by full name, email address, or phone..."
            icon={Search}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          placeholder="All User Roles"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          options={[
            { value: "CUSTOMER", label: "Customers Only" },
            { value: "STAFF", label: "Staff Only" },
            { value: "ADMIN", label: "Admins Only" },
          ]}
        />
      </div>

      {/* Table */}
      {loading ? (
        <Spinner label="Loading user registry..." />
      ) : users.length > 0 ? (
        <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                        {u.full_name?.charAt(0) || "U"}
                      </div>
                      {u.full_name}
                    </td>

                    <td className="p-4 font-semibold text-slate-800">{u.email}</td>

                    <td className="p-4 text-slate-600 font-mono">{u.phone || "—"}</td>

                    <td className="p-4">
                      <select
                        disabled={updatingId === u.id}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="STAFF">STAFF</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <Badge variant={u.is_active ? "success" : "danger"}>
                        {u.is_active ? "ACTIVE" : "DEACTIVATED"}
                      </Badge>
                    </td>

                    <td className="p-4 text-slate-500">{formatDate(u.created_at)}</td>

                    <td className="p-4 text-right">
                      <Button
                        variant={u.is_active ? "danger" : "success"}
                        size="sm"
                        isLoading={updatingId === u.id}
                        icon={u.is_active ? UserX : UserCheck}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              count={totalCount}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No Users Found"
          description="No user accounts match your search and role criteria."
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
