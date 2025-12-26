export interface WishState {
  text: string;
  loading: boolean;
  error: string | null;
}

export interface MusicState {
  playing: boolean;
  volume: number;
}

export interface Memory {
  id: number;
  url: string;
  message: string;
  date?: string; // Timeline date
  title?: string; // Title for the memory
}

export interface ClickEffect {
    id: number;
    x: number;
    y: number;
    content: string;
    color: string;
    rotation: number;
}

export interface OrnamentClickEffect {
    id: number;
    x: number;
    y: number;
    text: string;
    halo?: boolean;
}

export interface Gift {
    id: number;
    x: number;
    y: number;
    emoji: string;
}

export interface LoveMessage {
    id: number;
    text: string;
    timestamp: Date;
}

export interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export enum AnimationState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SHOWING = 'SHOWING'
}