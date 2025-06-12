import { ShortLinkForm } from "@/components/short-link-form";

export default function Home() {
  return (
    <div className="h-full bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4 w-full">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-gray-800/20 p-6 mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            短链接生成器
          </h1>
          <p className="text-gray-600 dark:text-gray-300">创建您的短链接，让分享更简单</p>
        </div>
        <ShortLinkForm />
      </div>
    </div>
  );
}
