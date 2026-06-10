import { ModuleData } from '@/constants/roadmapData';

export interface Coordinate {
  x: number;
  y: number;
}

export interface RoadmapGeometry {
  coordinates: { [key: string]: Coordinate };
  totalHeight: number;
  intermediateStartY: number;
  intermediateHeight: number;
  advancedStartY: number;
  advancedHeight: number;
}

export const calculateRoadmapGeometry = (modules: ModuleData[]): RoadmapGeometry => {
  const coordinates: { [key: string]: Coordinate } = {};
  
  const beginnerList = modules.filter(m => m.level === 'Beginner');
  const intermediateList = modules.filter(m => m.level === 'Intermediate');
  const advancedList = modules.filter(m => m.level === 'Advanced');
  
  const WAVE_X_PATTERN = [30, 55, 75, 60, 35, 24];
  
  // 1. Beginner Region (y starts at 200)
  let currentY = 200;
  beginnerList.forEach((mod, idx) => {
    coordinates[mod.id] = {
      x: WAVE_X_PATTERN[idx % WAVE_X_PATTERN.length],
      y: currentY
    };
    currentY += 220;
  });
  coordinates['summit_beginner'] = { x: 50, y: currentY };
  
  // 2. Intermediate Region
  currentY += 300;
  const startIntermediateY = currentY;
  intermediateList.forEach((mod, idx) => {
    coordinates[mod.id] = {
      x: WAVE_X_PATTERN[(idx + 1) % WAVE_X_PATTERN.length],
      y: currentY
    };
    currentY += 220;
  });
  coordinates['summit_intermediate'] = { x: 50, y: currentY };
  
  // 3. Advanced Region
  currentY += 300;
  const startAdvancedY = currentY;
  advancedList.forEach((mod, idx) => {
    coordinates[mod.id] = {
      x: WAVE_X_PATTERN[(idx + 2) % WAVE_X_PATTERN.length],
      y: currentY
    };
    currentY += 220;
  });
  coordinates['summit_advanced'] = { x: 50, y: currentY };
  
  return {
    coordinates,
    totalHeight: currentY + 240,
    intermediateStartY: startIntermediateY - 180,
    intermediateHeight: startAdvancedY - startIntermediateY + 110,
    advancedStartY: startAdvancedY - 180,
    advancedHeight: currentY - startAdvancedY + 110,
  };
};
