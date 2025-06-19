"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { MyUrlsTable } from "@/components/url-table/my-urls-table";
import { columns, type Url } from "@/components/url-table/columns";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface GetUserShortURLsResponse {
  urls: Url[];
}

export default function MyUrlsPage() {
  const { user, isAuthenticated } = useAuth();
  const [urls, setUrls] = useState<Url[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUrls = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 获取所有数据，不再使用后端分页
      const params = new URLSearchParams({
        username: user.username,
        page: "1",
        per_page: "1000", // 获取更多数据，让前端表格处理分页
      });

      const response = await fetch(`/api/user/my_urls?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("获取短链接列表失败");
      }

      const data: GetUserShortURLsResponse = await response.json();
      setUrls(data.urls || []);
    } catch (error) {
      console.error("获取短链接列表失败:", error);
      toast.error("获取短链接列表失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const handleRefresh = () => {
    fetchUrls();
    toast.success("数据已刷新");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 页面标题和操作栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              你好 {user ? `, ${user.username} !` : ""}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              这里是您创建的短链接列表，您可以在这里查看、管理和创建新的短链接。
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>刷新</span>
            </Button>
            <Link href="/">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>创建短链接</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {urls.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              当前总链接数
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {urls.filter(url => !url.expired_at?.Valid || new Date(url.expired_at.Time) > new Date()).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              当前有效链接
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {urls.filter(url => url.is_custom).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              当前自定义链接
            </div>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-6">
            <MyUrlsTable
              columns={columns}
              data={urls}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
