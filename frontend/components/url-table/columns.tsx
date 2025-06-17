"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Copy, ExternalLink } from "lucide-react"
import { toast } from "sonner"

// 根据后端 repo.Url 模型定义的类型
// Example of a URL object from the backend API
// {
//     "id": 6,
//     "original_url": "https://echo.labstack.com/docs/cookbook/jwt",
//     "short_code": "zagAcL9",
//     "is_custom": false,
//     "created_at": "2025-06-17T13:29:55.633664Z",
//     "expired_at": {
//         "Time": "2025-06-19T13:29:55.633268Z",
//         "Valid": true
//     },
//     "created_by": {
//         "String": "trozure",
//         "Valid": true
//     }
// },
export type Url = {
  id: number
  original_url: string
  short_code: string
  is_custom: boolean
  created_at: string
  expired_at: {
    Time: string
    Valid: boolean
  } | null
  created_by: {
    String: string
    Valid: boolean
  } | null
}

export const columns: ColumnDef<Url>[] = [
  {
    accessorKey: "short_code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          短代码
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const shortCode = row.getValue("short_code") as string
      const shortUrl = `${window.location.origin}/${shortCode}`

      return (
        <div className="flex items-center space-x-2">
          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
            {shortCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(shortUrl)
              toast.success("短链接已复制到剪贴板")
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(shortUrl, '_blank')}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      )
    },
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
          原始链接
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const originalUrl = row.getValue("original_url") as string

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
              navigator.clipboard.writeText(originalUrl)
              toast.success("原始链接已复制到剪贴板")
            }}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: "is_custom",
    header: "类型",
    cell: ({ row }) => {
      const isCustom = row.getValue("is_custom") as boolean

      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${isCustom
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          }`}>
          {isCustom ? "自定义" : "系统生成"}
        </span>
      )
    },
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
          创建时间
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as string
      const date = new Date(createdAt)

      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString("zh-CN")}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">
            {date.toLocaleTimeString("zh-CN")}
          </div>
        </div>
      )
    },
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
          过期时间
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    sortingFn: (rowA, rowB) => {
      const expiredAtA = rowA.getValue("expired_at") as Url["expired_at"]
      const expiredAtB = rowB.getValue("expired_at") as Url["expired_at"]
      
      // 永不过期的项目视为最大值
      const timeA = (!expiredAtA || !expiredAtA.Valid) ? Infinity : new Date(expiredAtA.Time).getTime()
      const timeB = (!expiredAtB || !expiredAtB.Valid) ? Infinity : new Date(expiredAtB.Time).getTime()
      
      return timeA - timeB
    },
    cell: ({ row }) => {
      const expiredAt = row.getValue("expired_at") as Url["expired_at"]

      if (!expiredAt || !expiredAt.Valid) {
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
            永不过期
          </span>
        )
      }

      const date = new Date(expiredAt.Time)
      const now = new Date()
      const isExpired = date < now

      return (
        <div className="text-sm">
          <div className={isExpired ? "text-red-600 dark:text-red-400" : ""}>
            {date.toLocaleDateString("zh-CN")}
          </div>
          <div className={`text-xs ${isExpired
              ? "text-red-500 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
            }`}>
            {date.toLocaleTimeString("zh-CN")}
            {isExpired && " (已过期)"}
          </div>
        </div>
      )
    },
  },
]