import { useState } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";

interface SettingsViewProps {
  onClose: () => void;
  currentLocalModel: string;
  currentCloudModel: string;
  currentGeminiKey: string;
  onSave: (localModel: string, cloudModel: string, geminiKey: string) => void;
}

export function SettingsView({ onClose, currentLocalModel, currentCloudModel, currentGeminiKey, onSave }: SettingsViewProps) {
  const [localModel, setLocalModel] = useState(currentLocalModel);
  const [cloudModel, setCloudModel] = useState(currentCloudModel);
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey);

  const handleSave = () => {
    onSave(localModel, cloudModel, geminiKey);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        className="hud-panel"
        style={{ width: "400px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "16px", color: "var(--accent)", letterSpacing: "0.1em", fontWeight: "bold" }}>// SYSTEM SETTINGS</h2>
          <button onClick={onClose} style={{ color: "var(--text-secondary)" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>LOCAL AI MODEL</label>
            <input
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder="e.g. qwen2.5-coder:3b"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                padding: "8px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>CLOUD AI MODEL</label>
            <input
              value={cloudModel}
              onChange={(e) => setCloudModel(e.target.value)}
              placeholder="e.g. gemini-2.5-flash"
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                padding: "8px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>GEMINI API KEY</label>
            <input
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              type="password"
              placeholder="AIza..."
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid var(--border)",
                padding: "8px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px"
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "none",
            padding: "10px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          <Save size={16} /> SAVE & APPLY
        </button>
      </div>
    </motion.div>
  );
}
