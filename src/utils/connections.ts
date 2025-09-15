// Shared connections store for all routes
export const connections = new Map<string, any>();

export function addConnection(connectionId: string, connection: any): void {
  connections.set(connectionId, connection);
}

export function getConnection(connectionId: string): any {
  return connections.get(connectionId);
}

export function removeConnection(connectionId: string): boolean {
  return connections.delete(connectionId);
}

export function getAllConnections(): Map<string, any> {
  return connections;
}
