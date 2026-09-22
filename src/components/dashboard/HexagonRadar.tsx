import React from 'react';

interface HexagonRadarProps {
  metrics: {
    kernel: number;
    network: number;
    storage: number;
    container: number;
    troubleshooting: number;
    security: number;
  };
}

export const HexagonRadar: React.FC<HexagonRadarProps> = ({ metrics }) => {
  const size = 180;
  const center = size / 2;
  const radius = size * 0.38;

  const categories = [
    { key: 'kernel', label: '内核', val: metrics.kernel },
    { key: 'network', label: '网络', val: metrics.network },
    { key: 'storage', label: '存储', val: metrics.storage },
    { key: 'container', label: '容器', val: metrics.container },
    { key: 'troubleshooting', label: '排错', val: metrics.troubleshooting },
    { key: 'security', label: '安全', val: metrics.security },
  ];

  const totalPoints = categories.length;

  const getCoordinates = (index: number, valueRatio: number) => {
    const angle = (Math.PI * 2 / totalPoints) * index - Math.PI / 2;
    const r = radius * valueRatio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 生成同心多边形
  const rings = [0.25, 0.5, 0.75, 1.0];

  // 生成用户实际数据多边形
  const polygonPoints = categories
    .map((c, i) => {
      const ratio = Math.max(0.1, Math.min(1.0, c.val / 100));
      const pt = getCoordinates(i, ratio);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* 背景网格环 */}
        {rings.map((ring, ringIdx) => {
          const ringPts = Array.from({ length: totalPoints })
            .map((_, i) => {
              const pt = getCoordinates(i, ring);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={ringIdx}
              points={ringPts}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray={ringIdx < 3 ? '2 2' : 'none'}
            />
          );
        })}

        {/* 轴线 */}
        {categories.map((_, i) => {
          const outerPt = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="#1e293b"
              strokeWidth="1"
            />
          );
        })}

        {/* 实际战力数据覆盖多边形 */}
        <polygon
          points={polygonPoints}
          fill="rgba(56, 189, 248, 0.25)"
          stroke="#38BDF8"
          strokeWidth="2"
          className="transition-all duration-700 ease-out"
        />

        {/* 关键顶点圆点 */}
        {categories.map((c, i) => {
          const ratio = Math.max(0.1, Math.min(1.0, c.val / 100));
          const pt = getCoordinates(i, ratio);
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#38BDF8"
              className="drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
            />
          );
        })}

        {/* 标签文字 */}
        {categories.map((c, i) => {
          const labelPt = getCoordinates(i, 1.25);
          return (
            <text
              key={i}
              x={labelPt.x}
              y={labelPt.y + 4}
              fontSize="10"
              fill="#94a3b8"
              textAnchor="middle"
              className="font-mono font-medium"
            >
              {c.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
