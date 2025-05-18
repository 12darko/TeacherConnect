import { WebSocketServer } from 'ws';
import { Server } from 'http';
import { log } from './vite';

/**
 * Sets up a diagnostic WebSocket server on a separate path to avoid conflicts.
 * This will help us test WebSocket connectivity separately from Vite HMR.
 */
export function setupWebSocketDiagnostic(server: Server) {
  try {
    // Create WebSocket server on a separate path to avoid conflicts with Vite
    const wss = new WebSocketServer({ 
      server,
      path: '/ws-diagnostic',
      perMessageDeflate: false // Disable compression to simplify debugging
    });

    wss.on('connection', (ws) => {
      log('WebSocket diagnostic connection established', 'ws-diagnostic');
      
      ws.on('message', (message) => {
        log(`Received: ${message}`, 'ws-diagnostic');
        // Echo back the message
        ws.send(`Echo: ${message}`);
      });

      ws.on('error', (error) => {
        log(`WebSocket error: ${error.message}`, 'ws-diagnostic');
      });

      ws.on('close', () => {
        log('WebSocket connection closed', 'ws-diagnostic');
      });

      // Send a welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'WebSocket diagnostic connection successful'
      }));
    });

    wss.on('error', (error) => {
      log(`WebSocket server error: ${error.message}`, 'ws-diagnostic');
    });

    log('WebSocket diagnostic server initialized', 'ws-diagnostic');
  } catch (error: any) {
    log(`Failed to initialize WebSocket diagnostic server: ${error.message}`, 'ws-diagnostic');
  }
}