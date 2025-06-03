import { LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers';

export interface TemplateLoopCardConfig extends LovelaceCardConfig {
  type: 'custom:template-loop-card';
  template: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  spacing?: string;
  no_items_message?: string;
  show_errors?: boolean;
  card_mod?: {
    style?: string;
  };
}

export interface TemplateItem {
  type: string;
  [key: string]: any;
}

export interface ProcessedTemplate {
  items: TemplateItem[];
  error?: string;
}

export interface HomeAssistant {
  callService: (domain: string, service: string, serviceData?: any) => Promise<any>;
  callWS: (msg: any) => Promise<any>;
  connection: any;
  connected: boolean;
  states: { [entity_id: string]: any };
  config: any;
  themes: any;
  selectedTheme: any;
  user: any;
  panels: any;
  services: any;
  language: string;
  resources: any;
  localize: (key: string, ...args: any[]) => string;
}

export interface LovelaceElement extends HTMLElement {
  hass?: HomeAssistant;
  config?: any;
  setConfig?: (config: any) => void;
}

export interface CardHelpers {
  createCardElement: (config: LovelaceCardConfig) => LovelaceCard;
  createRowElement: (config: any) => any;
}