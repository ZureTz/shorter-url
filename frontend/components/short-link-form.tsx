"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  original_url: z.string().url("请输入有效的URL地址").min(1, "原始链接不能为空"),
  custom_code: z.string().optional().refine((val) => !val || (val.length >= 4 && val.length <= 10 && /^[a-zA-Z0-9]+$/.test(val)), {
    message: "自定义别名必须是4-10位的字母或数字"
  }),
  duration: z.number().min(1, "有效期最少1小时").max(720, "有效期最多720小时（30天）").optional(),
});

export function ShortLinkForm() {
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
      console.log('提交的表单数据:', values);
      const response = await fetch('/api/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('短链接创建成功:', result);
        // TODO: 显示成功消息和生成的短链接
      } else {
        console.error('创建短链接失败:', response.statusText);
        // TODO: 显示错误消息
      }
    } catch (error) {
      console.error('请求失败:', error);
      // TODO: 显示错误消息
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="original_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>原始链接</FormLabel>
              <FormControl>
                <Input placeholder="请输入要缩短的URL地址，如：https://example.com" {...field} />
              </FormControl>
              <FormDescription>
                请输入您要缩短的完整URL地址
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
              <FormLabel>自定义别名（可选）</FormLabel>
              <FormControl>
                <Input placeholder="输入4-10位字母或数字，如：mylink" {...field} />
              </FormControl>
              <FormDescription>
                不填写将自动生成随机别名
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
              <FormLabel>有效期（小时）</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="输入1-720小时，默认为168小时（7天）" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                不填写则默认7天有效期，最长可设置30天
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
  );
}
