const DEVICE_ID_KEY = 'mes_device_id';

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `WEB-${crypto.randomUUID()}`;
  }

  return `WEB-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = createDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}
