import { DivideIcon as LucideIcon } from 'lucide-react';

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
  | '2100' // Entregado
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
    status_name?: string; // Nombre del estado (ej: "DELIVERY")
    additionals?: Array<{
      additionalCode: string;
      additionalSubCode?: string;
      additionalFlag?: boolean;
      additionalValue?: number;
    }>;
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

export interface Additional {
  additionalShippingCode: string | null;
  additionalCode: string;
  additionalSubCode?: string;
  additionalFlag?: boolean;
  additionalValue?: number;
  pointName?: string | null;
  providerCode?: string;
  organicPointCode?: string;
}

export interface PudoPoint {
  provider_code: string;
  point_code: string;
  point_name: string;
  phone_number: string;
  is_active: string;
  organic_point_code: string;
  is_ctt_active_pick_up: boolean;
  is_ctt_active_drop_off: boolean;
  is_ctt_active_pick_up_commercial: boolean;
  is_ctt_active_drop_off_commercial: boolean;
  is_ctt_active_pick_up_quality: boolean;
  is_ctt_active_drop_off_quality: boolean;
  is_ctt_active_pick_up_operations: boolean;
  is_ctt_active_drop_off_operations: boolean;
  is_ctt_active_pick_up_discretionary: boolean;
  is_ctt_active_drop_off_discretionary: boolean;
  address: {
    address: string;
    address2: string;
    postal_code: string;
    country_code: string;
    gps_location: {
      latitude: number;
      longitude: number;
    };
  };
  openning_hours: Array<{
    day_of_week: number;
    hours: Array<{
      from: string;
      to: string;
    }>;
  }>;
  is_active_dates: null | string[];
  is_inactive_dates: null | string[];
  history: any[];
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
  additionals?: Additional[];
  shipping_type_code?: string;
  client_center_code?: string;
  traffic_type_code?: string;
  
  // Campos adicionales de dirección
  origin_country_code: string;
  origin_postal_code: string;
  origin_address: string;
  origin_address2: string;
  origin_town_name: string;
  destin_country_code: string;
  destin_postal_code: string;
  destin_address: string;
  destin_address2: string;
  destin_town_name: string;
}

export type ViewMode = 'shipping' | 'packages' | 'comparison';