export interface ShippingEvent {
  code: string;
  description: string;
  type: string;
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

export interface ShippingData {
  shipping_history: {
    item_code: string;
    events: ShippingEvent[];
  };
  shipping_code: string;
  main_shipping_code: string;
  last_shipping_status_code: string;
  origin_province_name: string;
  destin_province_name: string;
  recipient_name: string;
  sender_name: string;
  recipient_address: string;
  sender_address: string;
  shipping_status_code: string;
}