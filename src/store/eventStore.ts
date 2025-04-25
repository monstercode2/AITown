import { create } from 'zustand';
import { Event } from '../types/event';

interface EventStore {
  events: Event[];
  addEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  clearEvents: () => void;
  fetchEvents: () => Promise<void>;
}

export const useEventStore = create<EventStore>((set) => ({
  events: [],
  
  addEvent: (event) => set((state) => ({
    events: [...state.events, event]
  })),
  
  removeEvent: (eventId) => set((state) => ({
    events: state.events.filter((event) => event.id !== eventId)
  })),
  
  clearEvents: () => set({ events: [] }),

  fetchEvents: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/simulation');
      if (!response.ok) return;
      const data = await response.json();
      console.log('fetchEvents 拉取到的 events:', data.events);
      if (Array.isArray(data.events)) {
        set({ events: data.events });
      }
    } catch (e) {
      console.error('fetchEvents error:', e);
    }
  },
})); 