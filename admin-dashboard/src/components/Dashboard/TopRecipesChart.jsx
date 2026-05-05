import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function TopRecipesChart({ data }) {
  const chartData = data.map((item) => ({
    name:
      item.title.length > 15
        ? item.title.slice(0, 15) + '...'
        : item.title,

    // support BOTH favorite + cooked
    count: parseInt(
      item.favorite_count || item.cook_count || item.value || 0
    ),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar
          dataKey="count"
          fill="#3b82f6"
          radius={[0, 6, 6, 0]}
          barSize={30}
          label={{ position: 'right' }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default TopRecipesChart;