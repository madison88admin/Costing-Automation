"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connections = void 0;
exports.addConnection = addConnection;
exports.getConnection = getConnection;
exports.removeConnection = removeConnection;
exports.getAllConnections = getAllConnections;
exports.connections = new Map();
function addConnection(connectionId, connection) {
    exports.connections.set(connectionId, connection);
}
function getConnection(connectionId) {
    return exports.connections.get(connectionId);
}
function removeConnection(connectionId) {
    return exports.connections.delete(connectionId);
}
function getAllConnections() {
    return exports.connections;
}
//# sourceMappingURL=connections.js.map