import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/carousel.css";
import Sidebar, { SidebarProvider } from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from '@/contexts/NotificationContext';
import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';
import AccountDeactivationNotice from '@/components/AccountDeactivationNotice';
import StateResetWrapper from '@/components/StateResetWrapper';
import { Toaster } from 'react-hot-toast';
import MainContentWrapper from "@/components/MainContentWrapper";
import DatabaseCleanupWrapper from "@/components/DatabaseCleanupWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Armed Forces of the Philippines Personnel Management System",
  description: "Personnel management system for the Armed Forces of the Philippines",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            <SidebarProvider>
              <StateResetWrapper>
                <Sidebar />
                <MainContentWrapper>
                  {children}
                </MainContentWrapper>
                <SessionTimeoutWarning />
                <AccountDeactivationNotice />
                <DatabaseCleanupWrapper />
                <Toaster position="top-right" />
              </StateResetWrapper>
            </SidebarProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
