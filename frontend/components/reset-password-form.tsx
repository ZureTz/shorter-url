"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm() {
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();

  const formSchema = z
    .object({
      email: z
        .string()
        .min(1, t("resetPasswordForm.emailRequired"))
        .email(t("resetPasswordForm.emailInvalid")),
      email_code: z
        .string()
        .min(1, t("resetPasswordForm.emailCodeRequired"))
        .length(6, t("resetPasswordForm.emailCodeLength"))
        .regex(/^\d{6}$/, t("resetPasswordForm.emailCodeInvalid")),
      password: z
        .string()
        .min(1, t("resetPasswordForm.newPasswordRequired"))
        .min(6, t("resetPasswordForm.newPasswordMin"))
        .max(50, t("resetPasswordForm.newPasswordMax"))
        .regex(
          /^[a-zA-Z0-9_!@#$%^&*]+$/,
          t("resetPasswordForm.newPasswordInvalid"),
        ),
      confirmed_password: z
        .string()
        .min(1, t("resetPasswordForm.confirmedPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmed_password, {
      message: t("resetPasswordForm.passwordMismatch"),
      path: ["confirmed_password"],
    });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      email_code: "",
      password: "",
      confirmed_password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log("提交的重置密码数据:", values);

      const response = await fetch("/api/reset_password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("resetPasswordForm.resetSuccess"), {
          description: t("resetPasswordForm.resetSuccessDesc"),
        });
        form.reset();
        // 重置成功后跳转到登录页面
        router.push("/login");
      } else {
        toast.error(t("resetPasswordForm.resetError"), {
          description: data.message || t("resetPasswordForm.resetErrorDesc"),
        });
      }
    } catch (error) {
      console.error("密码重置失败:", error);
      toast.error(t("resetPasswordForm.resetException"), {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 发送邮箱验证码
  const sendEmailCode = async () => {
    const email = form.getValues("email");

    if (!email) {
      toast.error(t("resetPasswordForm.emailRequired"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("resetPasswordForm.emailInvalid"));
      return;
    }

    try {
      setIsCodeSending(true);

      const response = await fetch("/api/email_code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("resetPasswordForm.sendCodeSuccess"));

        // 开始倒计时
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(t("resetPasswordForm.sendCodeError"), {
          description: data.message,
        });
      }
    } catch (error) {
      console.error("发送验证码失败:", error);
      toast.error(t("resetPasswordForm.sendCodeError"), {
        description: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setIsCodeSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("resetPasswordForm.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("resetPasswordForm.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("resetPasswordForm.emailDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("resetPasswordForm.emailCode")}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder={t("resetPasswordForm.emailCodePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendEmailCode}
                    disabled={isCodeSending || countdown > 0}
                    className="whitespace-nowrap"
                  >
                    {isCodeSending
                      ? t("common.loading")
                      : countdown > 0
                        ? `${countdown}s ${t("resetPasswordForm.resendCode")}`
                        : t("resetPasswordForm.sendCodeButton")}
                  </Button>
                </div>
                <FormDescription>
                  {t("resetPasswordForm.emailCodeDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("resetPasswordForm.newPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("resetPasswordForm.newPasswordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("resetPasswordForm.newPasswordDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmed_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("resetPasswordForm.confirmedPassword")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t(
                      "resetPasswordForm.confirmedPasswordPlaceholder",
                    )}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("resetPasswordForm.confirmedPasswordDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? t("common.loading")
              : t("resetPasswordForm.resetButton")}
          </Button>
        </form>
      </Form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t("resetPasswordForm.backToLogin")}
          </Link>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t("loginForm.noAccount")}{" "}
          <Link
            href="/register"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t("loginForm.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
