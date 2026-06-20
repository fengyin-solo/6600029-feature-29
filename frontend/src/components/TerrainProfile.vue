<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { useDroneStore } from '../store/drone';

const store = useDroneStore();
const canvas = ref<HTMLCanvasElement>();

function draw() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;

  const W = 800;
  const H = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, W, H);

  const profile = store.terrainProfile;
  if (profile.length < 2) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无航线数据 — 规划航线后显示地形剖面', W / 2, H / 2);
    return;
  }

  const distances: number[] = [0];
  for (let i = 1; i < profile.length; i++) {
    const dx = (profile[i].lng - profile[i - 1].lng) * 111000;
    const dy = (profile[i].lat - profile[i - 1].lat) * 111000;
    distances.push(distances[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const maxDist = distances[distances.length - 1] || 1;

  let minAlt = Infinity;
  let maxAlt = -Infinity;
  for (const p of profile) {
    minAlt = Math.min(minAlt, p.terrainElevation);
    maxAlt = Math.max(maxAlt, p.altitude);
  }
  minAlt = Math.max(0, minAlt - 20);
  maxAlt = maxAlt + 20;
  const altRange = maxAlt - minAlt || 1;

  const toX = (d: number) => padding.left + (d / maxDist) * plotW;
  const toY = (a: number) => padding.top + plotH - ((a - minAlt) / altRange) * plotH;

  const segments = store.flightSegments;

  ctx.beginPath();
  ctx.moveTo(toX(distances[0]), toY(profile[0].terrainElevation));
  for (let i = 1; i < profile.length; i++) {
    ctx.lineTo(toX(distances[i]), toY(profile[i].terrainElevation));
  }
  ctx.lineTo(toX(distances[distances.length - 1]), padding.top + plotH);
  ctx.lineTo(toX(0), padding.top + plotH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(139,92,46,0.6)';
  ctx.fill();
  ctx.strokeStyle = '#92613a';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX(distances[0]), toY(profile[0].terrainElevation));
  for (let i = 1; i < profile.length; i++) {
    ctx.lineTo(toX(distances[i]), toY(profile[i].terrainElevation));
  }
  for (let i = profile.length - 1; i >= 0; i--) {
    ctx.lineTo(toX(distances[i]), toY(profile[i].altitude));
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,197,94,0.1)';
  ctx.fill();

  for (let i = 1; i < profile.length; i++) {
    const x1 = toX(distances[i - 1]);
    const y1 = toY(profile[i - 1].altitude);
    const x2 = toX(distances[i]);
    const y2 = toY(profile[i].altitude);

    const seg = segments[i - 1];
    const isHigh = seg?.isHighConsumption;

    if (isHigh) {
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#ef4444');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < profile.length; i++) {
    const segBefore = segments[i - 1];
    const segAfter = segments[i];
    const isNearHigh = segBefore?.isHighConsumption || segAfter?.isHighConsumption;

    ctx.beginPath();
    ctx.arc(toX(distances[i]), toY(profile[i].altitude), isNearHigh ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isNearHigh ? '#f97316' : '#60a5fa';
    ctx.fill();
    ctx.strokeStyle = isNearHigh ? '#c2410c' : '#1d4ed8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const d = (maxDist / xTicks) * i;
    const x = toX(d);
    ctx.fillText(`${(d / 1000).toFixed(1)} km`, x, padding.top + plotH + 16);
    ctx.beginPath();
    ctx.moveTo(x, padding.top + plotH);
    ctx.lineTo(x, padding.top + plotH + 4);
    ctx.strokeStyle = '#475569';
    ctx.stroke();
  }

  ctx.textAlign = 'right';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const a = minAlt + (altRange / yTicks) * i;
    const y = toY(a);
    ctx.fillText(`${Math.round(a)}m`, padding.left - 6, y + 4);
    ctx.beginPath();
    ctx.moveTo(padding.left - 3, y);
    ctx.lineTo(padding.left, y);
    ctx.strokeStyle = '#475569';
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(padding.left + 10, padding.top + 4, 12, 3);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('正常航段', padding.left + 26, padding.top + 10);

  ctx.fillStyle = '#f97316';
  ctx.fillRect(padding.left + 90, padding.top + 4, 12, 3);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('高耗电航段', padding.left + 106, padding.top + 10);

  ctx.fillStyle = 'rgba(139,92,46,0.8)';
  ctx.fillRect(padding.left + 180, padding.top + 2, 12, 8);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('地形', padding.left + 196, padding.top + 10);
}

onMounted(() => nextTick(draw));
watch(() => store.terrainProfile, draw, { deep: true });
watch(() => store.flightSegments, draw, { deep: true });
</script>

<template>
  <canvas
    ref="canvas"
    width="800"
    height="200"
    class="w-full rounded-lg border border-slate-700"
  />
</template>
