import { create } from 'zustand';
import { Event } from '@/types/event';

interface EventStore {
  events: Event[];
  addEvent: (event: Event) => void;
  removeEvent: (eventId: string) => void;
  clearEvents: () => void;
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
})); 