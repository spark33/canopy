"use client";

import { TopBar } from "@/components/layout/TopBar";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="max-w-[600px] mx-auto px-7 py-8">
        <h1 className="text-[18px] font-medium mb-6">Settings</h1>
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-[13px] text-text-secondary">
            Configure your AgentOps instance. Settings are stored in environment variables.
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-[13px] font-medium">API Key</span>
              <span className="text-[12px] text-text-tertiary">Configured via .env</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-[13px] font-medium">Database</span>
              <span className="text-[12px] text-text-tertiary">SQLite (dev)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] font-medium">Search API</span>
              <span className="text-[12px] text-text-tertiary">Brave Search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
