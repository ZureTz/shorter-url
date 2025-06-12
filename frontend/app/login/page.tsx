"use client";

import { useAuth } from "@/contexts/auth-context";
import { LoginForm } from "@/components/login-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
            登录
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            请登录以访问短链接生成器
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
