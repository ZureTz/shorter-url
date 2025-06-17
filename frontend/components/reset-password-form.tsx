"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
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

const formSchema = z.object({
  email: z
    .string()
    .min(1, "邮箱不能为空")
    .email("请输入有效的邮箱地址"),
  email_code: z
    .string()
    .min(1, "验证码不能为空")
    .length(6, "验证码必须是6位数字")
    .regex(/^\d{6}$/, "验证码只能包含数字"),
  password: z
    .string()
    .min(1, "密码不能为空")
    .min(6, "密码至少需要6个字符")
    .max(50, "密码不能超过50个字符")
    .regex(/^[a-zA-Z0-9_!@#$%^&*]+$/, "密码只能包含字母、数字、下划线和特殊字符"),
  confirmed_password: z
    .string()
    .min(1, "确认密码不能为空"),
}).refine((data) => data.password === data.confirmed_password, {
  message: "两次输入的密码不一致",
  path: ["confirmed_password"],
});

export function ResetPasswordForm() {
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

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
        toast.success("密码重置成功！", {
          description: "请使用新密码登录",
        });
        form.reset();
        // 重置成功后跳转到登录页面
        router.push("/login");
      } else {
        toast.error("密码重置失败", {
          description: data.message || "请检查输入信息是否正确",
        });
      }
    } catch (error) {
      console.error("密码重置失败:", error);
      toast.error("密码重置过程中出现错误", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  // 发送邮箱验证码
  const sendEmailCode = async () => {
    const email = form.getValues("email");
    
    if (!email) {
      toast.error("请先输入邮箱地址");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("请输入有效的邮箱地址");
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
        toast.success("验证码发送成功！", {
          description: "请查看您的邮箱",
        });
        
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
        toast.error("发送验证码失败", {
          description: data.message || "请稍后重试",
        });
      }
    } catch (error) {
      console.error("发送验证码失败:", error);
      toast.error("发送验证码失败", {
        description: "网络错误，请稍后重试",
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
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="请输入您的邮箱地址"
                    {...field}
                  />
                </FormControl>
                <FormDescription>请输入您注册时使用的邮箱地址</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>邮箱验证码</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="请输入6位验证码"
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
                      ? "发送中..." 
                      : countdown > 0 
                      ? `${countdown}秒后重试` 
                      : "发送验证码"
                    }
                  </Button>
                </div>
                <FormDescription>点击发送验证码按钮获取邮箱验证码</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>新密码</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="请输入新密码"
                    {...field}
                  />
                </FormControl>
                <FormDescription>6-50个字符，可包含字母、数字、下划线和特殊字符</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmed_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>确认新密码</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="请再次输入新密码"
                    {...field}
                  />
                </FormControl>
                <FormDescription>请再次输入上面的新密码</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "重置中..." : "重置密码"}
          </Button>
        </form>
      </Form>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          想起密码了？{" "}
          <Link 
            href="/login" 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            返回登录
          </Link>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          还没有账号？{" "}
          <Link 
            href="/register" 
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            立即注册
          </Link>
        </p>
      </div>

    </div>
  );
}
