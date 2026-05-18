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
            <select
              value={cloudModel}
              onChange={(e) => setCloudModel(e.target.value)}
              style={{
                background: "#141414",
                border: "1px solid var(--border)",
                padding: "8px",
                paddingRight: "32px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                outline: "none",
                borderRadius: "0px",
                WebkitAppearance: "none",
                MozAppearance: "none",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ff3b30' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
                backgroundSize: "16px",
                colorScheme: "dark"
              }}
            >
              <option value="gemini-2.5-flash" style={{ background: "#141414", color: "#ffffff" }}>Google Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro" style={{ background: "#141414", color: "#ffffff" }}>Google Gemini 2.5 Pro</option>
              <option value="gpt-4o" style={{ background: "#141414", color: "#ffffff" }}>OpenAI GPT-4o</option>
              <option value="gpt-4-turbo" style={{ background: "#141414", color: "#ffffff" }}>OpenAI GPT-4 Turbo</option>
              <option value="claude-3-5-sonnet" style={{ background: "#141414", color: "#ffffff" }}>Anthropic Claude 3.5 Sonnet</option>
              <option value="claude-3-opus" style={{ background: "#141414", color: "#ffffff" }}>Anthropic Claude 3 Opus</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>API KEY</label>
            <input
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              type="password"
              placeholder="Enter API Key for the selected model..."
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
