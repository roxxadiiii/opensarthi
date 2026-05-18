import { useState, useCallback } from "react";
import { AssistantOverlay } from "./components/assistant/AssistantOverlay";
import { PermissionDialog } from "./components/permissions/PermissionDialog";
import { SettingsView } from "./components/settings/SettingsView";
import { useTauriEvent } from "./hooks/useTauriEvent";
import { useWebSocket } from "./hooks/useWebSocket";
import { TAURI_EVENTS } from "./lib/constants";
import { wsClient } from "./lib/ws";
import { AnimatePresence } from "framer-motion";

export default function App() {
  const [runtimePort, setRuntimePort] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [localModel, setLocalModel] = useState("qwen2.5-coder:3b");
  const [cloudModel, setCloudModel] = useState("gemini-1.5-pro");
  const [geminiKey, setGeminiKey] = useState("");

  // Listen for the runtime sidecar to announce its port
  useTauriEvent<number>(TAURI_EVENTS.RUNTIME_PORT_READY, useCallback((port) => {
    setRuntimePort(port);
  }, []));

  // Connect WebSocket once port is known
  useWebSocket(runtimePort);

  const handleSaveSettings = (newLocal: string, newCloud: string, newKey: string) => {
    setLocalModel(newLocal);
    setCloudModel(newCloud);
    setGeminiKey(newKey);
    wsClient.send("update_settings", {
      local_model: newLocal,
      cloud_model: newCloud,
      gemini_api_key: newKey
    });
  };

  return (
    <>
      <AssistantOverlay onOpenSettings={() => setShowSettings(true)} />
      <PermissionDialog />
      <AnimatePresence>
        {showSettings && (
          <SettingsView
            onClose={() => setShowSettings(false)}
            currentLocalModel={localModel}
            currentCloudModel={cloudModel}
            currentGeminiKey={geminiKey}
            onSave={handleSaveSettings}
          />
        )}
      </AnimatePresence>
    </>
  );
}
