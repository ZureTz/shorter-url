"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
import { Toaster } from "@/components/ui/sonner";

export function ShortLinkForm() {
  const { t } = useTranslation();

  const formSchema = z.object({
    original_url: z
      .string()
      .url(t("shortLinkForm.invalidUrl"))
      .min(1, t("shortLinkForm.originalUrlRequired")),
    custom_code: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          (val.length >= 4 && val.length <= 10 && /^[a-zA-Z0-9]+$/.test(val)),
        {
          message: t("shortLinkForm.customCodeInvalid"),
        },
      ),
    duration: z
      .number()
      .min(1, t("shortLinkForm.durationMin"))
      .max(365, t("shortLinkForm.durationMax"))
      .optional(),
  });

  const [shortLinkResult, setShortLinkResult] = useState<{
    shortUrl: string;
    expiredAt: string;
  } | null>(null);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      original_url: "",
      custom_code: "",
      duration: undefined,
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const userData = localStorage.getItem("user_data") || "{}";
    const user = JSON.parse(userData);
    try {
      const response = await fetch("/api/user/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...values, created_by: user?.username }),
      });

      if (response.ok) {
        const result = await response.json();

        // 复制短链接到剪贴板
        if (result.short_url || result.shortUrl) {
          navigator.clipboard.writeText(result.short_url || result.shortUrl);
        }

        toast.success(t("shortLinkForm.createSuccess"), {
          description: t("shortLinkForm.createSuccessDesc", {
            shortUrl: result.short_url || result.shortUrl,
          }),
        });

        form.reset();

        // 保存短链接结果
        setShortLinkResult({
          shortUrl: result.short_url || result.shortUrl,
          expiredAt: result.expired_at || result.expiredAt,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("创建短链接失败:", response.statusText);
        toast.error(t("shortLinkForm.createError"), {
          description: errorData.message || response.statusText,
        });
      }
    } catch (error) {
      console.error("请求失败:", error);
      toast.error(t("shortLinkForm.createError"), {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="original_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shortLinkForm.originalUrl")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("shortLinkForm.originalUrlPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("shortLinkForm.originalUrlDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custom_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shortLinkForm.customCode")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("shortLinkForm.customCodePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t("shortLinkForm.customCodeDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("shortLinkForm.duration")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={t("shortLinkForm.durationPlaceholder")}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {t("shortLinkForm.durationDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            {t("shortLinkForm.generateButton")}
          </Button>
        </form>
      </Form>
      <Toaster position="bottom-right" richColors />

      {/* 显示生成的短链接 */}
      {shortLinkResult && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            {t("shortLinkForm.createSuccess")}
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("shortLinkForm.shortUrl")}:{" "}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <code className="px-2 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded text-sm break-all dark:text-gray-200">
                  {shortLinkResult.shortUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shortLinkResult.shortUrl);
                    toast.success(t("shortLinkForm.copied"));
                  }}
                >
                  {t("common.copy")}
                </Button>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("shortLinkForm.expiredAt")}:{" "}
              </span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {!shortLinkResult.expiredAt ||
                shortLinkResult.expiredAt === "0001-01-01T00:00:00Z"
                  ? t("shortLinkForm.permanent")
                  : new Date(shortLinkResult.expiredAt).toLocaleString(
                      navigator.language,
                    )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
