"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

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
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();

  const formSchema = z
    .object({
      username: z
        .string()
        .min(1, t("registerForm.usernameRequired"))
        .min(3, t("registerForm.usernameMin"))
        .max(20, t("registerForm.usernameMax"))
        .regex(/^[a-zA-Z0-9_]+$/, t("registerForm.usernameInvalid")),
      password: z
        .string()
        .min(1, t("registerForm.passwordRequired"))
        .min(6, t("registerForm.passwordMin"))
        .max(50, t("registerForm.passwordMax"))
        .regex(/^[a-zA-Z0-9_!@#$%^&*]+$/, t("registerForm.passwordInvalid")),
      confirmed_password: z
        .string()
        .min(1, t("registerForm.confirmedPasswordRequired")),
      email: z
        .string()
        .min(1, t("registerForm.emailRequired"))
        .email(t("registerForm.emailInvalid")),
      email_code: z
        .string()
        .min(1, t("registerForm.emailCodeRequired"))
        .length(6, t("registerForm.emailCodeLength"))
        .regex(/^\d{6}$/, t("registerForm.emailCodeInvalid")),
    })
    .refine((data) => data.password === data.confirmed_password, {
      message: t("registerForm.passwordMismatch"),
      path: ["confirmed_password"],
    });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmed_password: "",
      email: "",
      email_code: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("registerForm.registerSuccess"), {
          description: t("registerForm.registerSuccessDesc"),
        });
        form.reset();
        // Route to login page after successful registration
        router.push("/login");
      } else {
        toast.error(t("registerForm.registerError"), {
          description: data.message || t("registerForm.registerErrorDesc"),
        });
      }
    } catch (error) {
      console.error("注册失败:", error);
      toast.error(t("registerForm.registerException"), {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // 发送邮箱验证码
  const sendEmailCode = async () => {
    const email = form.getValues("email");

    if (!email) {
      toast.error(t("registerForm.emailRequired"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t("registerForm.emailInvalid"));
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
        toast.success(t("registerForm.sendCodeSuccess"));

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
        toast.error(t("registerForm.sendCodeError"), {
          description: data.message,
        });
      }
    } catch (error) {
      console.error("发送验证码失败:", error);
      toast.error(t("registerForm.sendCodeError"), {
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
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("registerForm.username")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("registerForm.usernamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("registerForm.usernameDescription")}
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
                <FormLabel>{t("registerForm.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("registerForm.passwordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("registerForm.passwordDescription")}
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
                <FormLabel>{t("registerForm.confirmedPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("registerForm.confirmedPasswordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("registerForm.confirmedPasswordDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("registerForm.email")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("registerForm.emailPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("registerForm.emailDescription")}
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
                <FormLabel>{t("registerForm.emailCode")}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder={t("registerForm.emailCodePlaceholder")}
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
                        ? `${countdown}s ${t("registerForm.resendCode")}`
                        : t("registerForm.sendCodeButton")}
                  </Button>
                </div>
                <FormDescription>
                  {t("registerForm.emailCodeDescription")}
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
              : t("registerForm.registerButton")}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t("registerForm.hasAccount")}{" "}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t("registerForm.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
