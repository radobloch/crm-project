import React, { useState } from 'react';
import { Shield, Check, X, Lock, Key, Users, Info } from 'lucide-react';
import { RolePermission, Collection } from '../types';

interface RolePermissionManagerProps {
  roles: RolePermission[];
  collections: Collection[];
  onUpdateRolePermission: (
    roleId: string,
    collectionId: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'export',
    value: boolean
  ) => void;
}

export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  roles,
  collections,
  onUpdateRolePermission,
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.roleId || 'admin');

  const currentRole = roles.find((r) => r.roleId === selectedRoleId) || roles[0];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-[#27272a] p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <span className="bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              Granular Security
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage field-level and action-level CRUD authorizations across roles and collections
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Roles List */}
        <div className="w-72 bg-zinc-900/60 border-r border-[#27272a] p-3 space-y-1.5 shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-2">
            Security Roles ({roles.length})
          </div>

          {roles.map((r) => {
            const isSelected = selectedRoleId === r.roleId;
            return (
              <button
                key={r.roleId}
                onClick={() => setSelectedRoleId(r.roleId)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 shadow-2xs'
                    : 'bg-zinc-900 border-[#27272a] hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span className={isSelected ? 'text-emerald-200' : 'text-zinc-100'}>{r.roleName}</span>
                  {r.roleId === 'admin' && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                  {r.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right: Permission Matrix Table */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          <div className="bg-zinc-900 p-5 rounded-xl border border-[#27272a] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Permissions for: <span className="text-emerald-400">{currentRole.roleName}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">{currentRole.description}</p>
              </div>

              {currentRole.roleId === 'admin' && (
                <span className="text-xs bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2.5 py-1 rounded-md font-medium">
                  Administrator has full wildcard permissions
                </span>
              )}
            </div>

            {/* Matrix Table */}
            <div className="border border-[#27272a] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/80 border-b border-[#27272a] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Data Collection</th>
                    <th className="px-4 py-3 text-center">Read / View</th>
                    <th className="px-4 py-3 text-center">Create</th>
                    <th className="px-4 py-3 text-center">Update / Edit</th>
                    <th className="px-4 py-3 text-center">Delete</th>
                    <th className="px-4 py-3 text-center">Export Data</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#27272a]">
                  {collections.map((col) => {
                    const perm = currentRole.permissions[col.id] || {
                      create: false,
                      read: true,
                      update: false,
                      delete: false,
                      export: false,
                    };

                    const isAdmin = currentRole.roleId === 'admin';

                    return (
                      <tr key={col.id} className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-200">
                          <div className="flex items-center space-x-2">
                            <span>{col.title}</span>
                            <span className="text-[10px] font-mono text-zinc-500 font-normal">
                              ({col.name})
                            </span>
                          </div>
                        </td>

                        {(['read', 'create', 'update', 'delete', 'export'] as const).map((action) => {
                          const isAllowed = isAdmin ? true : perm[action];
                          return (
                            <td key={action} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={isAllowed}
                                disabled={isAdmin}
                                onChange={(e) =>
                                  onUpdateRolePermission(
                                    currentRole.roleId,
                                    col.id,
                                    action,
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-zinc-950 border-[#27272a] cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
