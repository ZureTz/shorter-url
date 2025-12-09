"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Copy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TFunction } from "i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// 根据后端 repo.Url 模型定义的类型
export type Url = {
  id: number;
  original_url: string;
  short_code: string;
  is_custom: boolean;
  created_at: string;
  expired_at: {
    Time: string;
    Valid: boolean;
  } | null;
  created_by: {
    String: string;
    Valid: boolean;
  } | null;
};

// 创建列定义的工厂函数，接受翻译函数和刷新回调
export const createColumns = (t: TFunction, onDelete?: () => void): ColumnDef<Url>[] => [
  {
    accessorKey: "short_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          {t("urlTable.shortCode")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const shortCode = row.getValue("short_code") as string;
      const shortUrl = `${window.location.origin}/${shortCode}`;

      return (
        <div className="flex items-center space-x-2">
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
            {shortCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(shortUrl);
              toast.success(t("urlTable.copied"));
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(shortUrl, "_blank")}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      );
    }
  },
  {
    accessorKey: "original_url",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          {t("urlTable.originalUrl")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const originalUrl = row.getValue("original_url") as string;

      return (
        <div className="flex items-center space-x-2 max-w-md">
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline truncate"
            title={originalUrl}
          >
            {originalUrl}
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(originalUrl);
              toast.success(t("urlTable.copied"));
            }}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      );
    }
  },
  {
    accessorKey: "is_custom",
    header: t("urlTable.isCustom"),
    cell: ({ row }) => {
      const isCustom = row.getValue("is_custom") as boolean;

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isCustom
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {isCustom ? t("urlTable.yes") : t("urlTable.no")}
        </span>
      );
    }
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          {t("urlTable.createdAt")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string;
      const date = new Date(createdAt);

      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString(navigator.language)}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">
            {date.toLocaleTimeString(navigator.language)}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "expired_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          {t("urlTable.expiredAt")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    sortingFn: (rowA, rowB) => {
      const expiredAtA = rowA.getValue("expired_at") as Url["expired_at"];
      const expiredAtB = rowB.getValue("expired_at") as Url["expired_at"];

      // 永不过期的项目视为最大值
      const timeA =
        !expiredAtA || !expiredAtA.Valid ? Infinity : new Date(expiredAtA.Time).getTime();
      const timeB =
        !expiredAtB || !expiredAtB.Valid ? Infinity : new Date(expiredAtB.Time).getTime();

      return timeA - timeB;
    },
    cell: ({ row }) => {
      const expiredAt = row.getValue("expired_at") as Url["expired_at"];

      if (!expiredAt || !expiredAt.Valid) {
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
            {t("urlTable.permanent")}
          </span>
        );
      }

      const date = new Date(expiredAt.Time);
      const now = new Date();
      const isExpired = date < now;

      return (
        <div className="text-sm">
          <div className={isExpired ? "text-red-600 dark:text-red-400" : ""}>
            {date.toLocaleDateString(navigator.language)}
          </div>
          <div
            className={`text-xs ${
              isExpired ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {date.toLocaleTimeString(navigator.language)}
            {isExpired && ` (${t("urlTable.expired", { defaultValue: "Expired" })})`}
          </div>
        </div>
      );
    }
  },
  {
    id: "actions",
    header: t("urlTable.actions"),
    cell: ({ row }) => {
      const url = row.original;

      const handleDelete = async () => {
        try {
          const response = await fetch("/api/user/url", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: url.id,
              short_code: url.short_code
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || t("urlTable.deleteError"));
          }

          toast.success(t("urlTable.deleteSuccess"));

          // 调用刷新回调
          if (onDelete) {
            onDelete();
          }
        } catch (error) {
          console.error("删除短链接失败:", error);
          toast.error(t("urlTable.deleteError"), {
            description: error instanceof Error ? error.message : "Unknown error"
          });
        }
      };

      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
              title="删除此短链接"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("urlTable.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("urlTable.deleteConfirmDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
  }
];
