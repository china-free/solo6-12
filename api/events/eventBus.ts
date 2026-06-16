type EventHandler = (event: DomainEvent) => void;

export interface DomainEvent {
  type: string;
  taskId: string;
  operatorId: string;
  operatorName: string;
  timestamp?: string;
  remark?: string;
  metadata?: Record<string, unknown>;
}

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  on(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  onAll(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  emit(event: DomainEvent): void {
    const eventWithTimestamp: DomainEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    for (const handler of this.globalHandlers) {
      try {
        handler(eventWithTimestamp);
      } catch (e) {
        console.error('Global event handler error:', e);
      }
    }

    const typeHandlers = this.handlers.get(event.type) || [];
    for (const handler of typeHandlers) {
      try {
        handler(eventWithTimestamp);
      } catch (e) {
        console.error(`Event handler error for ${event.type}:`, e);
      }
    }
  }
}

export const eventBus = new EventBus();
