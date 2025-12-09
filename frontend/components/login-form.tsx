"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
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
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const { login } = useAuth();
  const { t } = useTranslation();

  const formSchema = z.object({
    username: z
      .string()
      .min(1, t("loginForm.usernameRequired"))
      .min(3, t("loginForm.usernameMin"))
      .max(20, t("loginForm.usernameMax"))
      .regex(/^[a-zA-Z0-9_]+$/, t("loginForm.usernameInvalid")),
    password: z
      .string()
      .min(1, t("loginForm.passwordRequired"))
      .min(6, t("loginForm.passwordMin"))
      .max(50, t("loginForm.passwordMax"))
      .regex(/^[a-zA-Z0-9_!@#$%^&*]+$/, t("loginForm.passwordInvalid"))
  });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const success = await login(values.username, values.password);
      if (success) {
        toast.success(t("loginForm.loginSuccess"), {
          description: t("loginForm.loginSuccessDesc")
        });
        // 登录成功后，路由会自动重定向
      } else {
        toast.error(t("loginForm.loginError"), {
          description: t("loginForm.loginErrorDesc")
        });
      }
    } catch (error) {
      console.error("登录失败:", error);
      toast.error(t("loginForm.loginException"), {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("loginForm.username")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("loginForm.usernamePlaceholder")} {...field} />
                </FormControl>
                <FormDescription>{t("loginForm.usernameDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("loginForm.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("loginForm.passwordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("loginForm.passwordDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? t("common.loading") : t("loginForm.loginButton")}
          </Button>
        </form>
      </Form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <Link
            href="/reset-password"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t("loginForm.forgotPassword")}
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
