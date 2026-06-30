import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";

const DEMO_ACCOUNTS = [
  { role: "مدیر", email: "admin@crm.com", password: "admin123" },
  { role: "مشاور", email: "advisor@crm.com", password: "advisor123" },
  { role: "دستیار", email: "assistant@crm.com", password: "assistant123" },
];

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "ایمیل یا شماره موبایل را وارد کنید";
    if (!password) e.password = "رمز عبور را وارد کنید";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const user = await login({ email: email.trim(), password, remember });
      toast.success(`خوش آمدید ${user.name}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "ورود ناموفق بود");
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-bg via-bg to-gold-50 dark:to-gold-900/10">
      <ScrollAnimate type="fade-up" delay={0}>
        <div className="w-full max-w-md">
          {/* لوگو */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gold-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-gold-600/30">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-content">املاک CRM</h1>
            <p className="text-sm text-content-muted mt-1">
              مدیریت هوشمند املاک
            </p>
          </div>

          <div className="surface-card w-full sm:w-[30rem] p-4 sm:p-8">
            <h2 className="text-lg font-bold text-content mb-1">
              ورود به حساب
            </h2>
            <p className="text-sm text-content-muted mb-6">
              برای ادامه وارد حساب کاربری خود شوید
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="ایمیل یا شماره موبایل"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@crm.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email}
                required
                autoComplete="username"
              />
              <Input
                label="رمز عبور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password}
                showPasswordToggle
                required
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-gold-600 focus:ring-gold-500 cursor-pointer"
                  />
                  <span className="text-sm text-content">
                    مرا به خاطر بسپار
                  </span>
                </label>
              </div>

              <Button type="submit" fullWidth loading={loading} size="lg">
                ورود
              </Button>
            </form>

            {/* حساب‌های دمو */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-content-muted mb-2 text-center">
                حساب‌های نمایشی (برای تست سریع کلیک کنید):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="press-effect text-xs py-2 px-2 rounded-lg border border-border bg-surface hover:bg-surface-muted text-content cursor-pointer transition-colors"
                  >
                    {acc.role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-content-muted mt-6">
            ©{" "}
            {new Date()
              .getFullYear()
              .toLocaleString("fa-IR", { useGrouping: false })}{" "}
            املاک CRM
          </p>
        </div>
      </ScrollAnimate>
    </div>
  );
}
