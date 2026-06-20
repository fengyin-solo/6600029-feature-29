<script setup lang="ts">
import { useDroneStore } from '../store/drone';

const store = useDroneStore();

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function batteryColor(pct: number): string {
  if (pct < 50) return '#22c55e';
  if (pct < 80) return '#eab308';
  return '#ef4444';
}

function remainingColor(pct: number): string {
  if (pct > 50) return '#22c55e';
  if (pct > 20) return '#eab308';
  return '#ef4444';
}

function handleExport() {
  const kml = store.exportPlan();
  if (!kml) return;
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flight-plan.kml';
  a.click();
  URL.revokeObjectURL(url);
}

function handleLowThresholdChange(e: Event) {
  const target = e.target as HTMLInputElement;
  store.setLowBatteryThreshold(parseFloat(target.value));
}

function handleHighThresholdChange(e: Event) {
  const target = e.target as HTMLInputElement;
  store.setHighConsumptionThreshold(parseFloat(target.value));
}
</script>

<template>
  <div class="bg-slate-800 rounded-lg p-4 space-y-3">
    <h3 class="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2">
      飞行统计
    </h3>

    <div
      v-if="store.hasLowBatteryWarning"
      class="bg-red-900/40 border border-red-600 rounded p-2 flex items-start gap-2"
    >
      <span class="text-red-400 text-lg">⚠</span>
      <div class="text-xs text-red-300">
        <div class="font-bold">电池余量不足警告</div>
        <div>预计剩余电量 {{ store.remainingBattery.toFixed(1) }}% 低于阈值 {{ store.droneConfig.lowBatteryThreshold }}%</div>
      </div>
    </div>

    <div
      v-if="store.hasHighConsumptionWarning"
      class="bg-orange-900/40 border border-orange-600 rounded p-2 flex items-start gap-2"
    >
      <span class="text-orange-400 text-lg">⚡</span>
      <div class="text-xs text-orange-300">
        <div class="font-bold">检测到高耗电航段</div>
        <div>共 {{ store.highConsumptionSegments.length }} 个航段耗电量超过阈值</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 text-xs">
      <div class="bg-slate-900 rounded p-2">
        <div class="text-slate-400">总距离</div>
        <div class="text-lg font-bold text-sky-400">
          {{ (store.totalDistance / 1000).toFixed(2) }}
          <span class="text-xs text-slate-500">km</span>
        </div>
      </div>
      <div class="bg-slate-900 rounded p-2">
        <div class="text-slate-400">预计时间</div>
        <div class="text-lg font-bold text-sky-400">
          {{ formatTime(store.estimatedTime) }}
        </div>
      </div>
      <div class="bg-slate-900 rounded p-2">
        <div class="text-slate-400">电量消耗</div>
        <div class="text-lg font-bold" :style="{ color: batteryColor(store.batteryPercent) }">
          {{ store.batteryPercent.toFixed(1) }}%
        </div>
        <div class="w-full bg-slate-700 rounded-full h-1.5 mt-1">
          <div
            class="h-1.5 rounded-full transition-all"
            :style="{ width: store.batteryPercent + '%', backgroundColor: batteryColor(store.batteryPercent) }"
          />
        </div>
      </div>
      <div class="bg-slate-900 rounded p-2">
        <div class="text-slate-400">剩余电量</div>
        <div
          class="text-lg font-bold"
          :class="store.hasLowBatteryWarning ? 'animate-pulse' : ''"
          :style="{ color: remainingColor(store.remainingBattery) }"
        >
          {{ store.remainingBattery.toFixed(1) }}%
        </div>
        <div class="w-full bg-slate-700 rounded-full h-1.5 mt-1">
          <div
            class="h-1.5 rounded-full transition-all"
            :style="{ width: store.remainingBattery + '%', backgroundColor: remainingColor(store.remainingBattery) }"
          />
        </div>
      </div>
      <div class="bg-slate-900 rounded p-2">
        <div class="text-slate-400">航点数量</div>
        <div class="text-lg font-bold text-sky-400">{{ store.waypoints.length }}</div>
      </div>
      <div class="bg-slate-900 rounded p-2">
        <div class="text-slate-400">算法</div>
        <div class="text-lg font-bold text-purple-400 uppercase">
          {{ store.selectedAlgorithm }}
        </div>
      </div>
    </div>

    <div class="border-t border-slate-700 pt-2 space-y-2">
      <h4 class="text-xs text-slate-400">电池阈值设置</h4>
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[10px]">
          <span class="text-slate-500">低电量提醒</span>
          <span class="text-slate-300 font-medium">{{ store.droneConfig.lowBatteryThreshold }}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="50"
          step="1"
          :value="store.droneConfig.lowBatteryThreshold"
          @input="handleLowThresholdChange"
          class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
        />
      </div>
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[10px]">
          <span class="text-slate-500">高耗电阈值</span>
          <span class="text-slate-300 font-medium">{{ store.droneConfig.highConsumptionThreshold }}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="50"
          step="1"
          :value="store.droneConfig.highConsumptionThreshold"
          @input="handleHighThresholdChange"
          class="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
      </div>
    </div>

    <div v-if="store.highConsumptionSegments.length > 0" class="border-t border-slate-700 pt-2">
      <h4 class="text-xs text-slate-400 mb-1 flex items-center gap-1">
        <span class="text-orange-400">⚡</span>
        高耗电航段 ({{ store.highConsumptionSegments.length }})
      </h4>
      <div class="max-h-28 overflow-y-auto space-y-1 pr-1">
        <div
          v-for="seg in store.highConsumptionSegments"
          :key="seg.index"
          class="bg-orange-900/30 border border-orange-700/50 rounded p-1.5 text-[10px]"
        >
          <div class="flex justify-between items-center">
            <span class="text-orange-300 font-medium">航段 {{ seg.index + 1 }}</span>
            <span class="text-orange-400 font-bold">{{ seg.batteryUsage.toFixed(2) }}%</span>
          </div>
          <div class="text-slate-400 mt-0.5">
            距离 {{ (seg.distance / 1000).toFixed(2) }}km · {{ formatTime(seg.estimatedTime) }}
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-700 pt-2">
      <h4 class="text-xs text-slate-400 mb-1">无人机配置</h4>
      <div class="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
        <div>最大高度: {{ store.droneConfig.maxAltitude }}m</div>
        <div>最大速度: {{ store.droneConfig.maxSpeed }}m/s</div>
        <div>电池: {{ store.droneConfig.batteryCapacity }}mAh</div>
      </div>
    </div>

    <button
      @click="handleExport"
      :disabled="!store.currentPlan"
      class="w-full py-2 rounded text-xs font-medium bg-indigo-700 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      导出 KML
    </button>
  </div>
</template>
