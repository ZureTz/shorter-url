"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

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

const formSchema = z.object({
  original_url: z
    .string()
    .url("请输入有效的URL地址")
    .min(1, "原始链接不能为空"),
  custom_code: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        (val.length >= 4 && val.length <= 10 && /^[a-zA-Z0-9]+$/.test(val)),
      {
        message: "自定义别名必须是4-10位的字母或数字",
      }
    ),
  duration: z
    .number()
    .min(1, "有效期最少1天")
    .max(365, "有效期最多365天（1年）")
    .optional(),
});

export function ShortLinkForm() {
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
    try {
      const response = await fetch("/api/user/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("短链接创建成功！", {
          description: `短链接: ${result.short_url || result.shortUrl}`,
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
        toast.error("创建短链接失败", {
          description: errorData.message || response.statusText,
        });
      }
    } catch (error) {
      console.error("请求失败:", error);
      toast.error("网络请求失败", {
        description: "请检查网络连接后重试",
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
                <FormLabel>原始链接</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入要缩短的URL地址，如：https://example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>请输入您要缩短的完整URL地址</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custom_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>自定义别名（可选）</FormLabel>
                <FormControl>
                  <Input
                    placeholder="输入4-10位字母或数字，如：mylink"
                    {...field}
                  />
                </FormControl>
                <FormDescription>不填写将自动生成随机别名</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>有效期（天）</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="输入1-365天，不填写则默认无限期"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  不填写则默认无限期，最长可设置365天
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            生成短链接
          </Button>
        </form>
      </Form>
      <Toaster position="bottom-right" richColors />

      {/* 显示生成的短链接 */}
      {shortLinkResult && (
        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            短链接生成成功！
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                短链接：
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
                    toast.success("已复制到剪贴板");
                  }}
                >
                  复制
                </Button>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                有效期至：
              </span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {!shortLinkResult.expiredAt || shortLinkResult.expiredAt === "0001-01-01T00:00:00Z"
                  ? "无限期"
                  : new Date(shortLinkResult.expiredAt).toLocaleString(navigator.language)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
