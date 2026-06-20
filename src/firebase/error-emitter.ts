'use client';
import { EventEmitter } from 'events';

/**
 * Global error emitter for Firebase related errors, 
 * specifically for handling contextual Security Rules errors.
 */
export const errorEmitter = new EventEmitter();
