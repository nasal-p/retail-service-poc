import React from "react";
import { User, Mail, Phone, ShieldCheck, Calendar, Lock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { formatDate } from "../../utils/formatters";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your account registration details and security role.
        </p>
      </div>

      <Card className="p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="mt-2">
              <Badge variant={user?.role === "ADMIN" ? "amber" : user?.role === "STAFF" ? "purple" : "info"}>
                {user?.role} ACCOUNT
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
              Full Name
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              {user?.full_name}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
              Registered Email
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" />
              {user?.email}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
              Phone Number
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500" />
              {user?.phone || "Not provided"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
              Member Since
            </span>
            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              {formatDate(user?.created_at)}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>JWT session token active with standard permission scopes.</span>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
