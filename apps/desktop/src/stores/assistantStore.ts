import { create } from "zustand";
import type { Message, Plan, PlanStep, VoiceState } from "../lib/schemas";

interface AssistantState {
  // Session
  voiceState: VoiceState;
  isConnected: boolean;
  currentTranscript: string | null;

  // Conversation
  messages: Message[];

  // Execution
  currentPlan: Plan | null;
  executingStepIndex: number | null;

  // Actions
  setVoiceState: (state: VoiceState) => void;
  setConnected: (connected: boolean) => void;
  setTranscript: (text: string | null) => void;
  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setPlan: (plan: Plan | null) => void;
  updateStepStatus: (index: number, update: Partial<PlanStep>) => void;
  setExecutingStep: (index: number | null) => void;
  addOrUpdateToolAction: (tool: string, description: string, status: "pending" | "running" | "success" | "error" | "skipped", result?: any) => void;
}

export const useAssistantStore = create<AssistantState>((set) => ({
  voiceState: "idle",
  isConnected: false,
  currentTranscript: null,
  messages: [],
  currentPlan: null,
  executingStepIndex: null,

  setVoiceState: (voiceState) => set({ voiceState }),
  setConnected: (isConnected) => set({ isConnected }),
  setTranscript: (currentTranscript) => set({ currentTranscript }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  clearMessages: () => set({ messages: [], currentPlan: null }),

  setPlan: (currentPlan) => set({ currentPlan, executingStepIndex: null }),

  updateStepStatus: (index, update) =>
    set((s) => {
      if (!s.currentPlan) return s;
      const steps = s.currentPlan.steps.map((step, i) =>
        i === index ? { ...step, ...update } : step
      );
      return { currentPlan: { ...s.currentPlan, steps } };
    }),

  setExecutingStep: (executingStepIndex) => set({ executingStepIndex }),

  addOrUpdateToolAction: (tool, description, status, result) => set((s) => {
    let plan = s.currentPlan;
    if (!plan) {
      plan = { 
        id: crypto.randomUUID(), 
        goal: "Executing User Command...", 
        steps: [], 
        recovery_hint: null 
      };
    }

    // See if the step exists. PydanticAI streams tools sequentially.
    // If status is 'running', we create a new step or update the last one if it matches.
    let steps = [...plan.steps];
    
    // Check if we are updating an existing step
    const existingIndex = steps.findIndex(st => st.tool === tool && st.description === description && st.status === "running");
    
    if (existingIndex >= 0) {
      // Update existing
      steps[existingIndex] = { ...steps[existingIndex], status, result };
    } else {
      // Add new step
      steps.push({
        index: steps.length,
        tool,
        args: {},
        description,
        status,
        result
      });
    }

    return { currentPlan: { ...plan, steps } };
  }),
}));
