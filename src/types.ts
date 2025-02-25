export type EventType = 
  | 'EVENT'
  | 'SHIPPING_ITEM_EVENT_V1'
  | 'STATUS'
  | 'NOTIFICATION_V1';

export type StatusCode = 
  | '1500' // En reparto
  | '1600' // Reparto fallido
  | '1200' // Delegación destino
  | '0900' // En tránsito
  | string; // Otros códigos de estado

export type EventTypeCode = 
  | 'SORTER_READ_EVENT' // Lectura de clasificadora
  | 'MANUAL_SCAN'       // Escaneo manual
  | string;             // Otros tipos de eventos

export interface ShippingEvent {
  code: StatusCode;
  description: string;
  type: EventType;
  event_date: string;
  detail: {
    event_longitude_gps?: string | null;
    event_latitude_gps?: string | null;
    shipping_status_code?: StatusCode;
    event_courier_code?: string | null;
    signee_name?: string | null;
    event_text?: string;
    [key: string]: any;
  } | null;
}

export interface ItemHistory {
  item_code: string;
  events: ShippingEvent[];
}

export interface Package {
  item_code: string;
  events: ShippingEvent[];
  package_number: number;
}

export interface RedisInfo {
  param_id_1: string;
  status_code: string;
  [key: string]: any;
}

export interface ShippingData {
  shipping_history: {
    item_code: string;
    events: ShippingEvent[];
  };
  items_history: ItemHistory[];
  shipping_code: string;
  main_shipping_code: string;
  prime_shipping_code?: string;
  last_shipping_status_code?: StatusCode;
  origin_province_name: string;
  destin_province_name: string;
  recipient_name: string;
  sender_name: string;
  recipient_address: string;
  sender_address: string;
  shipping_status_code: StatusCode;
  item_count?: number;
  declared_weight?: number;
  final_weight?: number;
  redis_info?: RedisInfo;
}

export type ViewMode = 'shipping' | 'packages' | 'comparison';