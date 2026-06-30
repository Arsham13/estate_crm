import ScrollAnimate from "../components/common/ScrollAnimate.jsx";
import React from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertOctagon } from "lucide-react";
import Button from "../components/common/Button.jsx";

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <ScrollAnimate type="fade-up" delay={0}>
        <div className="text-center max-w-md">
          <div className="inline-flex p-5 rounded-2xl bg-red-100 text-error dark:bg-red-900/30 mb-6">
            <AlertOctagon className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-bold text-content mb-2">
            خطای غیرمنتظره
          </h1>
          <p className="text-sm text-content-muted mb-8">
            مشکلی پیش آمد. لطفاً دوباره تلاش کنید یا اگر مشکل ادامه داشت با
            پشتیبانی تماس بگیرید.
          </p>
          <Button
            onClick={() => {
              window.location.reload();
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            تلاش مجدد
          </Button>
        </div>
      </ScrollAnimate>
    </div>
  );
}
