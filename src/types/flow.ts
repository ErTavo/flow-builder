// Bot Controller Flow Types
export interface YumpiiFlow {
  structure: {
    entry: string;
    states: YumpiiState[];
    default: {
      text: string;
    };
    globals: GlobalKeyword[];
    business_hours: BusinessHour[];
  };
}

export interface YumpiiState {
  key: string;
  content: Content[];
  transitions: YumpiiTransition[];
  transition_delay: number;
}

export interface Content {
  type: 'text' | 'button' | 'image' | 'audio' | 'video' | 'document';
  value: TextValue | ButtonValue | MediaValue | DocumentValue;
  caption?: string;
}

export interface TextValue {
  text: string;
}

export interface ButtonValue {
  header?: {
    url: string;
    text: string;
    type: string;
  };
  buttons: ButtonOption[];
  bodyText?: string;
  footerText?: string;
}

export interface ButtonOption {
  id: string;
  title: string;
}

export interface MediaValue {
  url: string;
  caption?: string;
}

export interface DocumentValue {
  url: string;
  caption?: string;
  filename?: string;
}

export interface YumpiiTransition {
  next: string;
  type: 'auto' | 'contains' | 'exact' | 'script' | 'regex';
  delay?: number;
  value?: string;
  variable_replace?: Record<string, string | number | boolean>;
  params?: ScriptParams;
  position?: number;
}

export interface ScriptParams {
  script: string;
  transitions?: Record<string, string>;
  params?: {
    body?: Record<string, unknown>;
    method?: string;
    headers?: Record<string, unknown>;
    endpoint?: string;
  };
}

export interface GlobalKeyword {
  keywords: string[];
  stateKey: string;
}

export interface BusinessHour {
  key: string;
  schedules: Schedule[];
  fallbackStateKey: string;
}

export interface Schedule {
  endTime: string;
  dateFrom: string;
  weekDays: WeekDays;
  startTime: string;
  dateThrough: string;
}

export interface WeekDays {
  friday: boolean;
  monday: boolean;
  sunday: boolean;
  tuesday: boolean;
  saturday: boolean;
  thursday: boolean;
  wednesday: boolean;
}

// Editor-specific types (simplified node types for UI)
export interface EditorNode {
  id: string;
  type: 'start' | 'step' | 'end';
  data: EditorNodeData;
  position: { x: number; y: number };
}

export interface EditorNodeData extends Record<string, unknown> {
  label: string;
  key: string;
  stepType?: 'message' | 'button' | 'condition' | 'script' | 'delay';
  content?: Content[];
  transitions?: YumpiiTransition[];
  transition_delay?: number;
  isEntry?: boolean;
  variable_replace?: Record<string, string | number | boolean>;
}

export interface EditorFlow {
  nodes: EditorNode[];
  edges: EditorEdge[];
  yumpiiData?: YumpiiFlow;
}

export interface EditorEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

// Legacy types for compatibility (will be removed)
export interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value?: string | number | boolean | object | unknown[];
  description?: string;
}

export interface Action {
  type: 'response' | 'api_call' | 'webhook' | 'delay' | 'set_variable' | 'end_conversation';
  value?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  duration?: number;
  variable_name?: string;
}

export interface State {
  id: string;
  type: 'start' | 'message' | 'condition' | 'action' | 'end' | 'input';
  name?: string;
  description?: string;
  message?: string;
  condition?: string;
  input_type?: string;
  actions?: Action[];
  transitions?: YumpiiTransition[];
  transition_delay?: number;
}