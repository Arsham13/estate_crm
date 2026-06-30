import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Frown } from "lucide-react";
import Button from "../components/common/Button.jsx";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <ScrollAnimate type="fade-up" delay={0}>
        <div className="text-center max-w-md">
          <div className="inline-flex p-5 rounded-2xl bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400 mb-6">
            <Frown className="w-14 h-14" />
          </div>
          <h1 className="text-6xl font-bold text-gold-600 mb-3">۴۰۴</h1>
          <h2 className="text-xl font-bold text-content mb-2">صفحه پیدا نشد</h2>
          <p className="text-sm text-content-muted mb-8">
            متأسفیم! صفحه‌ای که به دنبال آن بودید وجود ندارد یا منتقل شده است.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            leftIcon={<Home className="w-4 h-4" />}
          >
            بازگشت به داشبورد
          </Button>
        </div>
      </ScrollAnimate>
    </div>
  );
}
