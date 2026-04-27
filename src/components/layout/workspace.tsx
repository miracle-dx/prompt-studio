"use client";

import { Sidebar } from "./sidebar";
import { HistoryView } from "../views/history-view";
import { SettingsView } from "../views/settings-view";
import { PromptEditor } from "../editor/prompt-editor";
import { useAppStore } from "@/lib/store";

export function Workspace() {
  const { activeView } = useAppStore();

  const renderContent = () => {
    switch (activeView) {
      case "history":
        return <HistoryView />;
      case "settings":
        return <SettingsView />;
      case "library":
      default:
        return <PromptEditor />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
