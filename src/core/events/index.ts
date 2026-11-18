import { ConfigurationState } from '../schema';
import { Quote } from '../pricing/pricing.types';

export type ConfiguratorEventMap = {
  'section:selected': { sectionId: string; origin: '2d' | '3d' | 'ui' };
  'section:hovered': { sectionId: string | null; origin: '2d' | '3d' | 'ui' };
  'texture:dirty': { sectionId: string };
  'texture:updated': { sectionId: string };
  'config:changed': { state: ConfigurationState };
  'pricing:updated': { quote: Quote };
  'preview:captured': { angle: string; dataUrl: string };
  'postMessage:out': { type: string; payload: unknown };
};

type EventCallback<T> = (data: T) => void;

class TypedEventBus {
  private listeners: { [K in keyof ConfiguratorEventMap]?: EventCallback<ConfiguratorEventMap[K]>[] } = {};

  on<K extends keyof ConfiguratorEventMap>(
    event: K,
    callback: EventCallback<ConfiguratorEventMap[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);

    return () => {
      this.off(event, callback);
    };
  }

  off<K extends keyof ConfiguratorEventMap>(
    event: K,
    callback: EventCallback<ConfiguratorEventMap[K]>
  ): void {
    const list = this.listeners[event];
    if (!list) return;
    this.listeners[event] = list.filter((cb) => cb !== callback);
  }

  emit<K extends keyof ConfiguratorEventMap>(
    event: K,
    data: ConfiguratorEventMap[K]
  ): void {
    const list = this.listeners[event];
    if (!list) return;
    for (const callback of list) {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in event handler for ${event}:`, err);
      }
    }
  }

  clear(): void {
    this.listeners = {};
  }
}

export const eventBus = new TypedEventBus();
