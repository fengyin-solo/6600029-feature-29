export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  altitude: number;   // meters AGL
  speed: number;      // m/s
  action: 'hover' | 'photo' | 'video' | 'none';
}

export interface FlightPlan {
  id: string;
  name: string;
  waypoints: Waypoint[];
  totalDistance: number;
  estimatedTime: number;
  batteryUsage: number;
  remainingBattery: number;
  segments: FlightSegment[];
}

export interface NoFlyZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;  // meters
  type: 'airport' | 'military' | 'restricted';
}

export interface TerrainPoint {
  lat: number;
  lng: number;
  elevation: number;
}

export interface FlightSegment {
  index: number;
  startWaypoint: Waypoint;
  endWaypoint: Waypoint;
  distance: number;
  estimatedTime: number;
  batteryUsage: number;
  isHighConsumption: boolean;
}

export interface FlightStatsResult {
  totalDistance: number;
  estimatedTime: number;
  batteryUsage: number;
  segments: FlightSegment[];
  remainingBattery: number;
}

export interface DroneConfig {
  maxAltitude: number;
  maxSpeed: number;
  batteryCapacity: number;
  consumptionRate: number;
  safeDistance: number;
  lowBatteryThreshold: number;
  highConsumptionThreshold: number;
}
