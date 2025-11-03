"use client";

import { Home, Inbox, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { LanguageToggle } from "@/components/language-toggle";
import { useAuth } from "@/contexts/auth-context";

export function AppSidebar() {
  const { logout } = useAuth();
  const { t } = useTranslation();

  // Menu items
  const appItems = [
    // Application menu items.
    {
      title: t("nav.createShortLink"),
      url: "/",
      icon: Home,
    },
    {
      title: t("nav.myShortLinks"),
      url: "/my-urls",
      icon: Inbox,
    },
  ];

  const userManagementItems = [
    // User management menu items
    {
      title: t("nav.logout"),
      url: "#",
      icon: LogOut,
      action: logout,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.application")}</SidebarGroupLabel>
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
          <SidebarGroupLabel>{t("nav.account")}</SidebarGroupLabel>
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
          <div className="flex justify-end gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
