"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  user_id: number;
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
    // 检查本地存储中的认证状态
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        // 这里应该调用后端API验证token
        // 暂时使用模拟数据
        const userData = localStorage.getItem("user_data");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error("检查认证状态失败:", error);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
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

      // 这里应该调用后端API进行登录
      // 暂时使用模拟登录逻辑
      if (username === "admin" && password === "password") {
        const mockUser: User = {
          user_id: 1,
          username: username,
          email: `${username}@example.com`,
        };

        // 模拟token
        const mockToken = "mock_jwt_token_" + Date.now();

        localStorage.setItem("auth_token", mockToken);
        localStorage.setItem("user_data", JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      } else {
        throw new Error("用户名或密码错误");
      }
    } catch (error) {
      console.error("登录失败:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
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
