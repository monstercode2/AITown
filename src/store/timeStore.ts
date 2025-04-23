import { create } from 'zustand';

interface TimeState {
  currentTime: number;  // 当前时间（以秒为单位）
  dayCount: number;     // 天数
  isPaused: boolean;    // 是否暂停
  speed: number;        // 模拟速度倍率
  setTime: (time: number) => void;
  incrementTime: (seconds: number) => void;
  resetTime: () => void;
  togglePause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  currentTime: 8 * 3600, // 从早上8点开始
  dayCount: 1,           // 从第1天开始
  isPaused: true,        // 初始状态为暂停
  speed: 1,              // 初始速度为1倍

  setTime: (time: number) => {
    set((state) => {
      const oldDay = Math.floor(state.currentTime / (24 * 3600));
      const newDay = Math.floor(time / (24 * 3600));
      return {
        currentTime: time,
        dayCount: state.dayCount + (newDay - oldDay),
      };
    });
  },

  incrementTime: (seconds: number) => {
    set((state) => {
      const newTime = state.currentTime + seconds;
      const oldDay = Math.floor(state.currentTime / (24 * 3600));
      const newDay = Math.floor(newTime / (24 * 3600));
      return {
        currentTime: newTime,
        dayCount: state.dayCount + (newDay - oldDay),
      };
    });
  },

  resetTime: () => {
    set({
      currentTime: 8 * 3600,
      dayCount: 1,
    });
  },

  togglePause: () => {
    set((state) => ({
      isPaused: !state.isPaused,
    }));
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },

  reset: () => {
    set({
      currentTime: 8 * 3600,
      dayCount: 1,
      isPaused: true,
      speed: 1,
    });
  },
})); 