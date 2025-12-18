/**
 * Discussion Store - Zustand state management for discussions
 */

import { create } from 'zustand';
import { Message, Expert, DiscussionStatus, SSEEvent, DebateStyle, DiscussionSummary } from '@/types';

interface StreamingExpert {
  id: string;
  name: string;
  color: string;
  debateStyle: DebateStyle;
}

interface DiscussionStore {
  // Discussion state
  discussionId: string | null;
  topic: string;
  status: DiscussionStatus;
  currentRound: number;
  totalRounds: number;
  model: string;
  language: string;
  moderatorMode: boolean;

  // Messages
  messages: Message[];
  streamingContent: string;
  streamingExpert: StreamingExpert | null;

  // Experts
  experts: Expert[];

  // Consensus
  consensusScore: number;

  // Summary
  summary: DiscussionSummary | null;

  // UI State
  isConnected: boolean;
  error: string | null;
  showModeratorInput: boolean;

  // Actions
  setDiscussion: (data: Partial<DiscussionStore>) => void;
  addMessage: (message: Message) => void;
  appendToStream: (content: string) => void;
  setStreamingExpert: (expert: StreamingExpert | null) => void;
  completeStream: (messageId: string, fullContent: string) => void;
  setStatus: (status: DiscussionStatus) => void;
  setRound: (round: number) => void;
  setConsensusScore: (score: number) => void;
  setSummary: (summary: DiscussionSummary) => void;
  setError: (error: string | null) => void;
  setShowModeratorInput: (show: boolean) => void;
  handleSSEEvent: (event: SSEEvent) => void;
  reset: () => void;
}

const initialState = {
  discussionId: null,
  topic: '',
  status: 'PENDING' as DiscussionStatus,
  currentRound: 0,
  totalRounds: 4,
  model: 'anthropic/claude-sonnet-4.5',
  language: 'en',
  moderatorMode: false,
  messages: [],
  streamingContent: '',
  streamingExpert: null,
  experts: [],
  consensusScore: 0,
  summary: null as DiscussionSummary | null,
  isConnected: false,
  error: null,
  showModeratorInput: false,
};

export const useDiscussionStore = create<DiscussionStore>((set, get) => ({
  ...initialState,

  setDiscussion: (data) => set((state) => ({ ...state, ...data })),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  appendToStream: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  setStreamingExpert: (expert) =>
    set({
      streamingExpert: expert,
      streamingContent: '',
    }),

  completeStream: (messageId, fullContent) =>
    set((state) => {
      const expert = state.streamingExpert;
      if (!expert) return state;

      const newMessage: Message = {
        id: messageId,
        content: fullContent,
        role: 'EXPERT',
        round: state.currentRound,
        debateStyle: expert.debateStyle,
        expertId: expert.id,
        expert: state.experts.find((e) => e.id === expert.id) || null,
        discussionId: state.discussionId || '',
        createdAt: new Date(),
      };

      return {
        messages: [...state.messages, newMessage],
        streamingContent: '',
        streamingExpert: null,
      };
    }),

  setStatus: (status) => set({ status }),

  setRound: (round) => set({ currentRound: round }),

  setConsensusScore: (score) => set({ consensusScore: score }),

  setSummary: (summary) => set({ summary }),

  setError: (error) => set({ error }),

  setShowModeratorInput: (show) => set({ showModeratorInput: show }),

  handleSSEEvent: (event) => {
    const state = get();

    switch (event.type) {
      case 'expert_start':
        set({
          streamingExpert: {
            id: event.expertId,
            name: event.expertName,
            color: event.expertColor,
            debateStyle: event.debateStyle,
          },
          streamingContent: '',
          currentRound: event.round,
          status: 'IN_PROGRESS',
          showModeratorInput: false,
        });
        break;

      case 'token':
        set({
          streamingContent: state.streamingContent + event.content,
        });
        break;

      case 'expert_complete':
        state.completeStream(event.messageId, event.fullContent);
        break;

      case 'round_complete':
        set({
          currentRound: event.round,
          consensusScore: event.consensusScore || 0,
        });
        break;

      case 'moderator_prompt':
        if (state.moderatorMode) {
          set({ showModeratorInput: true });
        }
        break;

      case 'discussion_summary':
        set({ summary: event.summary });
        break;

      case 'discussion_complete':
        set({
          status: 'COMPLETED',
          isConnected: false,
        });
        break;

      case 'error':
        set({
          error: event.message,
          status: 'PAUSED',
        });
        break;
    }
  },

  reset: () => set(initialState),
}));
