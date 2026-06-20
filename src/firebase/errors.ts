export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * Custom error class for Firestore permission errors.
 * Used to provide rich context for debugging Security Rules.
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    super(`Missing or insufficient permissions: The following request was denied by Firestore Security Rules at path: ${context.path}`);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
