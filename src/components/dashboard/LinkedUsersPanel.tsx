import React, { useCallback, useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { Customer } from "@/types/dashboard";

type LinkedUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function LinkedUsersPanel({ selectedCustomer }: { selectedCustomer: Customer }) {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const [editUser, setEditUser] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("customer");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/customers/linked-users", window.location.origin);
      if (selectedCustomer.jiraId) url.searchParams.set("jiraId", selectedCustomer.jiraId);
      url.searchParams.set("companyName", selectedCustomer.name);
      const r = await fetch(url.toString());
      const data = await r.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchUsers();
      setIsExpanded(false);
      setIsAddFormOpen(false);
      setAddMsg("");
      setEditUser(null);
    }
  }, [selectedCustomer, fetchUsers]);

  const handleAddLink = async () => {
    if (!addEmail) {
      setAddMsg("Email is required");
      return;
    }

    setAddMsg("Saving...");
    try {
      const r = await fetch("/api/customers/linked-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail,
          name: addName || "",
          companyName: selectedCustomer.name,
          jiraId: selectedCustomer.jiraId || "",
        }),
      });

      if (r.ok) {
        setAddMsg("Added/Linked successfully!");
        setAddEmail("");
        setAddName("");
        setIsAddFormOpen(false);
        fetchUsers();
      } else {
        const err = await r.json();
        setAddMsg(err.error || "Failed");
      }
    } catch {
      setAddMsg("Error saving.");
    }
  };

  const handleAction = async (action: string, id: number, extraPayload = {}) => {
    try {
      const r = await fetch("/api/customers/linked-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, ...extraPayload }),
      });

      if (r.ok) {
        if (action !== "delete" && action !== "edit") alert("Done!");
        fetchUsers();
        if (action === "edit") setEditUser(null);
      } else {
        const err = await r.json();
        alert(err.error || "Failed");
      }
    } catch {
      alert("Error occurred.");
    }
  };

  return (
    <div
      style={{
        background: "#F4F0EC",
        
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 18px",
          cursor: "pointer",
        }}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#0f172a",
            whiteSpace: "nowrap",
          }}
        >
          Dashboard Users :
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "thin",
          }}
        >
          {isLoading ? (
            <span style={{ fontSize: 13, color: "#64748b" }}>Loading...</span>
          ) : users.length === 0 ? (
            <span style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>
              No linked users
            </span>
          ) : (
            users.map((user) => (
              <span
                key={user.id}
                title={user.name || user.email}
                style={namePillStyle}
              >
                {user.name || user.email}
              </span>
            ))
          )}
        </div>

        <button
          type="button"
          aria-label="Add linked user"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
            setIsAddFormOpen(true);
            setAddMsg("");
          }}
          style={iconButtonStyle}
        >
          <Plus size={16} />
        </button>

        <button
          type="button"
          aria-label={isExpanded ? "Collapse linked users" : "Expand linked users"}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          style={iconButtonStyle}
        >
          <ChevronDown
            size={18}
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>
      </div>

      {isExpanded && (
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            padding: 18,
            background: "#fcfdff",
          }}
        >
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 520px", display: "flex", flexDirection: "column", gap: 10 }}>
              {isLoading ? (
                <div style={{ color: "#64748b", fontSize: 13 }}>Loading...</div>
              ) : users.length === 0 ? (
                <div style={emptyStateStyle}>
                  No users linked yet.
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      background: "#fff",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#334155", fontSize: 15 }}>
                        {user.name || "Unnamed User"}
                        <span style={roleBadgeStyle}>{user.role}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                      {user.email}
                    </div>

                    {editUser === user.id ? (
                      <div style={editBoxStyle}>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                          style={inputStyle}
                        />
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email"
                          style={inputStyle}
                        />
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="customer">Customer</option>
                          <option value="customer_team">Customer Team</option>
                        </select>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            onClick={() =>
                              handleAction("edit", user.id, {
                                name: editName,
                                email: editEmail,
                                role: editRole,
                              })
                            }
                            style={saveBtnStyle}
                          >
                            Save
                          </button>
                          <button onClick={() => setEditUser(null)} style={cancelBtnStyle}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => {
                            setEditUser(user.id);
                            setEditName(user.name);
                            setEditEmail(user.email);
                            setEditRole(user.role);
                          }}
                          style={actionBtnStyle}
                        >
                          Edit Email/Role
                        </button>
                        <button
                          onClick={() => {
                            const newPass = prompt(`Enter new password for ${user.email} (min 8 chars):`);
                            if (newPass && newPass.length >= 8) {
                              handleAction("reset_pass", user.id, { password: newPass });
                            }
                          }}
                          style={actionBtnStyle}
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to remove this user?")) {
                              handleAction("delete", user.id);
                            }
                          }}
                          style={dangerBtnStyle}
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {isAddFormOpen && (
              <div
                style={{
                  flex: "0 1 360px",
                  minWidth: 280,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
                  Add / Link User
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Full name (optional)"
                    style={inputStyle}
                  />
                  <input
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                    <button onClick={handleAddLink} style={primaryBtnStyle}>
                      Add / Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddFormOpen(false);
                        setAddMsg("");
                      }}
                      style={cancelBtnStyle}
                    >
                      Cancel
                    </button>
                    {addMsg && <span style={{ fontSize: 12, color: "#64748b" }}>{addMsg}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  color: "#334155",
};

const actionBtnStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
  cursor: "pointer",
};

const saveBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  background: "#123e67",
  color: "#fff",
  borderColor: "#123e67",
};

const cancelBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  background: "#f1f5f9",
};

const dangerBtnStyle: React.CSSProperties = {
  ...actionBtnStyle,
  background: "#fee2e2",
  color: "#991b1b",
  borderColor: "#fecaca",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "#f05323",
  color: "#fff",
  fontWeight: 700,
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
};

const iconButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  cursor: "pointer",
  flexShrink: 0,
};

const roleBadgeStyle: React.CSSProperties = {
  background: "#e2e8f0",
  color: "#475569",
  padding: "2px 8px",
  borderRadius: 12,
  fontSize: 10,
  marginLeft: 8,
  fontWeight: 700,
};

const namePillStyle: React.CSSProperties = {
  maxWidth: 180,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #dbe4ee",
  background: "#f8fafc",
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const editBoxStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: 10,
  padding: 10,
  background: "#f8fafc",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
};

const emptyStateStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  fontStyle: "italic",
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px dashed #cbd5e1",
  background: "#fff",
};
