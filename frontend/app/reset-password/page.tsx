"use client";

import { ResetPasswordForm } from "@/components/reset-password-form";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-800/20 p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t("resetPasswordForm.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t("resetPasswordForm.subtitle")}
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
