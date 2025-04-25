import { create } from 'zustand';
import { Position } from '../types/grid';

interface CameraState {
  position: Position;        // 摄像机位置
  followingAgentId: string | null;  // 当前跟随的Agent ID
  setPosition: (position: Position) => void;
  followAgent: (agentId: string | null) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  position: { x: 0, y: 0 },
  followingAgentId: null,

  setPosition: (position) => {
    set({ position });
  },

  followAgent: (agentId) => {
    set({ followingAgentId: agentId });
  },
})); 