interface EventTemplate {
  event_type_code: string;
  description: string;
  template: {
    metadata: {
      data_type: string;
      source: string;
    };
    package_event: {
      audit: {
        operation_hub_code: string;
        operation_uid: string;
        user_code: string;
      };
      event_info: Array<{
        platform_code: string;
        sorter_code: string;
        pda_code: string;
        sndid_code: string;
      }>;
      event_source_code: string;
      event_type_code: string;
      event_type_version: string;
    };
  };
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    event_type_code: "SORTER_READ_EVENT",
    description: "Lectura de clasificadora",
    template: {
      metadata: {
        data_type: "schema/json/traffic/traffic-cdc-package-event-v1.json",
        source: "urn:com:cttexpress:interchange:source:hub-actions-service"
      },
      package_event: {
        audit: {
          operation_hub_code: "",
          operation_uid: "",
          user_code: "urn:com:cttexpress:interchange:source:hub-actions"
        },
        event_info: [{
          platform_code: "008290",
          sorter_code: "sorter282",
          pda_code: "",
          sndid_code: "HUBACTIONS_SNID"
        }],
        event_source_code: "hub-actions",
        event_type_code: "SORTER_READ_EVENT",
        event_type_version: "v1"
      }
    }
  },
  {
    event_type_code: "MANUAL_SCAN",
    description: "Escaneo manual",
    template: {
      metadata: {
        data_type: "schema/json/traffic/traffic-cdc-package-event-v1.json",
        source: "urn:com:cttexpress:interchange:source:hub-actions-service"
      },
      package_event: {
        audit: {
          operation_hub_code: "",
          operation_uid: "",
          user_code: "urn:com:cttexpress:interchange:source:hub-actions"
        },
        event_info: [{
          platform_code: "008290",
          sorter_code: "",
          pda_code: "PDA001",
          sndid_code: "HUBACTIONS_SNID"
        }],
        event_source_code: "hub-actions",
        event_type_code: "MANUAL_SCAN",
        event_type_version: "v1"
      }
    }
  }
];