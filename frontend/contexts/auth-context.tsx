"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  user_id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 检查认证状态
  const checkAuthStatus = async () => {
    try {
      // 首先尝试从 localStorage 恢复用户数据
      const storedUserData = localStorage.getItem("user_data");
      if (!storedUserData) {
        // 没有本地数据，直接设置为未认证
        setIsLoading(false);
        return;
      }

      // 解析本地用户数据
      const userData: User = JSON.parse(storedUserData);

      // 验证本地数据是否仍然有效（调用后端验证）
      const response = await fetch("/api/user/test_auth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // 认证仍然有效，使用本地数据
        setUser(userData);
      } else {
        // 认证已失效，清除本地数据
        throw new Error("认证已失效");
      }

    } catch (error) {
      console.error("检查认证状态失败:", error);
      // 认证失败，清除本地数据
      localStorage.removeItem("user_data");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };



  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "登录失败");
      }

      const userData: User = {
        user_id: data.user_id,
        username: data.username,
        email: data.email,
      };

      localStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);
      return true;

    } catch (error) {
      console.error("登录失败:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // 清除前端状态
    localStorage.removeItem("user_data");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
