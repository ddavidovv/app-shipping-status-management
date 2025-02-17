export interface ShippingEvent {
  code: string;
  description: string;
  type: 'STATUS' | 'PACKAGE_EVENT' | 'NOTIFICATION_V1';
  event_date: string;
  detail: {
    event_longitude_gps?: string | null;
    event_latitude_gps?: string | null;
    shipping_status_code?: string;
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
  last_shipping_status_code?: string;
  origin_province_name: string;
  destin_province_name: string;
  recipient_name: string;
  sender_name: string;
  recipient_address: string;
  sender_address: string;
  shipping_status_code: string;
  item_count?: number;
  declared_weight?: number;
  final_weight?: number;
  redis_info?: RedisInfo;
}

export type ViewMode = 'shipping' | 'packages' | 'comparison';