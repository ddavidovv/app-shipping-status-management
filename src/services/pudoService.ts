import { PudoPoint } from '../types';

export const pudoService = {
  async getPudoPoint(organicPointCode: string): Promise<PudoPoint> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/enterprise-portal/shipping-status-mgmt/dlv/delivery-point/v1/point-management?organic_point_code=${organicPointCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data[0];
  }
};