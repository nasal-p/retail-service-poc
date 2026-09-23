import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Smartphone, LogIn, KeyRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim() || !password) {
      setFormError("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email, password);
      showSuccess(`Welcome back, ${user.full_name}!`);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Redirect by role
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (user.role === "STAFF") {
        navigate("/admin/orders");
      } else {
        navigate("/products");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.non_field_errors ||
        err.message ||
        "Invalid email or password.";
      setFormError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill preset account button for testing demo
  const fillPreset = (emailVal, passVal) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-hero">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Smartphone className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
            Mobile<span className="text-blue-600">Center</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Or{" "}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            create a new customer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="glass-card rounded-2xl p-8 border border-slate-200/80 shadow-xl">
          {formError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Seed Accounts for Demo */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Quick Demo Login Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillPreset("customer@mobilecenter.com", "Customer123!")}
                className="py-2 px-2 text-[11px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl transition-all border border-slate-200 text-center"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillPreset("staff@mobilecenter.com", "Staff123!")}
                className="py-2 px-2 text-[11px] font-bold bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-xl transition-all border border-slate-200 text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillPreset("admin@mobilecenter.com", "Admin123!")}
                className="py-2 px-2 text-[11px] font-bold bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 rounded-xl transition-all border border-slate-200 text-center"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
