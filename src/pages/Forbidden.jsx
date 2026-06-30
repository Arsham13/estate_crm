import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import Button from "../components/common/Button.jsx";

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <ScrollAnimate type="fade-up" delay={0}>
        <div className="text-center max-w-md">
          <div className="inline-flex p-5 rounded-2xl bg-red-100 text-error dark:bg-red-900/30 mb-6">
            <ShieldX className="w-14 h-14" />
          </div>
          <h1 className="text-4xl font-bold text-content mb-2">۴۰۳</h1>
          <h2 className="text-xl font-bold text-content mb-2">
            دسترسی غیرمجاز
          </h2>
          <p className="text-sm text-content-muted mb-8">
            شما اجازه دسترسی به این صفحه را ندارید.
          </p>
          <Button onClick={() => navigate("/dashboard")}>
            بازگشت به داشبورد
          </Button>
        </div>
      </ScrollAnimate>
    </div>
  );
}
