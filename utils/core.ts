
import { GameState, LogEntry } from '../types';

// Unique ID generator
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const shuffle = <T>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export const addLog = (prev: GameState, message: string): LogEntry[] => {
    return [{ id: generateId(), text: message }, ...prev.logs];
};
