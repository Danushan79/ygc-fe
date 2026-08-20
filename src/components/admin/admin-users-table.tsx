"use client";

import { Loader2, Search, Trash2, UserCheck, UserX, X } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteUserRequest, listUsersRequest, setUserActiveRequest } from "@/lib/api/admin-client";
import { ApiRequestError } from "@/lib/api/http-client";
import type { AdminUserSummaryDto } from "@/types/admin";

function formatDate(value: string | null): string {
  if (!value) {
    return "Never";
  }
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminUsersTable() {
  const [users, setUsers] = useState<AdminUserSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) {
          return undefined;
        }
        setIsLoading(true);
        setError(null);
        return listUsersRequest({ search: debouncedSearch, from: fromDate, to: toDate });
      })
      .then((data) => {
        if (!cancelled && data) {
          setUsers(data);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof ApiRequestError
              ? requestError.message
              : "Something went wrong. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, fromDate, toDate]);

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
  }

  async function handleToggleActive(user: AdminUserSummaryDto) {
    setPendingUserId(user.id);
    setError(null);
    try {
      const updated = await setUserActiveRequest(user.id, !user.isActive);
      setUsers((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleDelete(user: AdminUserSummaryDto) {
    const confirmed = window.confirm(
      `Delete ${user.fullName} (${user.email})? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setPendingUserId(user.id);
    setError(null);
    try {
      await deleteUserRequest(user.id);
      setUsers((prev) => prev.filter((existing) => existing.id !== user.id));
    } catch (requestError) {
      setError(
        requestError instanceof ApiRequestError
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  const hasFilters = Boolean(search || fromDate || toDate);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.02]">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={2}
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-xl border border-slate-300 py-2 pr-3 pl-9 text-sm transition-shadow focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm text-slate-700 transition-shadow focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            To
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="rounded-xl border border-slate-300 px-2 py-1.5 text-sm text-slate-700 transition-shadow focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </label>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Documents</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Last Login</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" strokeWidth={2} />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isPending = pendingUserId === user.id;
                return (
                  <tr key={user.id} className="text-slate-700 transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{user.fullName}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{user.documentCount}</td>
                    <td className="px-4 py-3">{formatDate(user.joinedAt)}</td>
                    <td className="px-4 py-3">{formatDate(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggleActive(user)}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            user.isActive
                              ? "text-amber-700 hover:bg-amber-50"
                              : "text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {user.isActive ? (
                            <UserX className="h-3.5 w-3.5" strokeWidth={2} />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(user)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
