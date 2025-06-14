"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

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

const formSchema = z.object({
  username: z
    .string()
    .min(1, "用户名不能为空")
    .min(3, "用户名至少需要3个字符")
    .max(20, "用户名不能超过20个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  password: z
    .string()
    .min(1, "密码不能为空")
    .min(6, "密码至少需要6个字符")
    .max(50, "密码不能超过50个字符")
    .regex(/^[a-zA-Z0-9_!@#$%^&*]+$/, "密码只能包含字母、数字、下划线和特殊字符"),
});

export function LoginForm() {
  const { login } = useAuth();

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log("提交的登录数据:", values);
      const success = await login(values.username, values.password);
      if (success) {
        toast.success("登录成功！", {
          description: "正在跳转到主页...",
        });
        // 登录成功后，路由会自动重定向
      } else {
        toast.error("登录失败", {
          description: "请检查用户名和密码是否正确",
        });
      }
    } catch (error) {
      console.error("登录失败:", error);
      toast.error("登录过程中出现错误", {
        description: error instanceof Error ? error.message : "未知错误",
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
                <FormLabel>用户名</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入用户名"
                    {...field}
                  />
                </FormControl>
                <FormDescription>请输入您的用户名</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    {...field}
                  />
                </FormControl>
                <FormDescription>请输入您的密码</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>
      </Form>

      <div className="text-sm text-gray-600 dark:text-gray-300 text-center space-y-1">
        <p className="font-medium">测试账号信息：</p>
        <p>用户名: admin</p>
        <p>密码: password</p>
      </div>
    </div>
  );
}
