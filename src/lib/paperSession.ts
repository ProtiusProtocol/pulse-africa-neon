// Generate or retrieve a persistent session ID for anonymous users
const SESSION_ID_KEY = "soccer-laduma-session-id";

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    // Generate a new UUID-like session ID
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  
  return sessionId;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_ID_KEY);
}
