import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function EquityCurve({
  data,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Equity Curve
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Account equity after each trade
        </p>
      </div>

      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          No trading history yet.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="trade"
                stroke="#64748b"
              />

              <YAxis
                stroke="#64748b"
                domain={["auto", "auto"]}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "10px",
                  color: "#fff",
                }}
                formatter={(value) =>
                  `₹${Number(value).toFixed(2)}`
                }
              />

              <Line
                type="monotone"
                dataKey="equity"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}