import { Home, Inbox, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { ModeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { logout } = useAuth();

  // Menu items
  const appItems = [
    // Application menu items.
    {
      title: "创建短链接",
      url: "/",
      icon: Home,
    },
    {
      title: "我的短链接",
      url: "my-urls",
      icon: Inbox,
    },
  ];

  const userManagementItems = [
    // User management menu items
    {
      title: "退出登录",
      url: "#",
      icon: LogOut,
      action: logout,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {/* User logout */}
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} onClick={item.action}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Foot fixed at the bottom */}
        <SidebarFooter className="mt-auto">
          <div className="flex justify-end">
            <ModeToggle />
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
