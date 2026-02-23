"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ── 시장별 색상 ──

const MARKET_COLORS: Record<string, string> = {
  KOSPI: "#3b82f6",
  KOSDAQ: "#22c55e",
  NYSE: "#f97316",
  NASDAQ: "#a855f7",
};

const DEFAULT_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#eab308"];

// ── 자산 배분 / 시장별 분포 도넛 차트 ──

interface AllocationDataItem {
  name: string;
  value: number;
}

interface AssetAllocationChartProps {
  data: AllocationDataItem[];
}

export function AssetAllocationChart({ data }: AssetAllocationChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        보유 종목이 없습니다.
      </p>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) =>
            `${name} ${((value / total) * 100).toFixed(1)}%`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={
                MARKET_COLORS[entry.name] ??
                DEFAULT_COLORS[index % DEFAULT_COLORS.length]
              }
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [
            `${(value ?? 0).toLocaleString("ko-KR")}원`,
            "평가금액",
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── 종목별 손익률 수평 바 차트 ──

interface PnLDataItem {
  name: string;
  pnlPercent: number;
}

interface HoldingsPnLChartProps {
  data: PnLDataItem[];
}

export function HoldingsPnLChart({ data }: HoldingsPnLChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        보유 종목이 없습니다.
      </p>
    );
  }

  const chartHeight = Math.max(200, data.length * 40 + 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${v.toFixed(1)}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            `${(value ?? 0).toFixed(2)}%`,
            "손익률",
          ]}
        />
        <Bar dataKey="pnlPercent" name="손익률" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={entry.pnlPercent >= 0 ? "#22c55e" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── 투자금 vs 평가금액 수직 바 차트 ──

interface ComparisonDataItem {
  name: string;
  invested: number;
  marketValue: number;
}

interface InvestmentComparisonChartProps {
  data: ComparisonDataItem[];
}

export function InvestmentComparisonChart({
  data,
}: InvestmentComparisonChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        보유 종목이 없습니다.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 10, right: 10 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}만`} />
        <Tooltip
          formatter={(value: number | undefined) => [
            `${(value ?? 0).toLocaleString("ko-KR")}원`,
          ]}
        />
        <Legend />
        <Bar
          dataKey="invested"
          name="투자금"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="marketValue"
          name="평가금액"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
