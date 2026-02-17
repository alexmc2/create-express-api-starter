import { statusTag } from './terminalUi.js';

export const logger = {
  info(message: string): void {
    console.log(`${statusTag('info')} ${message}`);
  },
  success(message: string): void {
    console.log(`${statusTag('success')} ${message}`);
  },
  warn(message: string): void {
    console.warn(`${statusTag('warn')} ${message}`);
  },
  error(message: string): void {
    console.error(`${statusTag('error')} ${message}`);
  }
};
