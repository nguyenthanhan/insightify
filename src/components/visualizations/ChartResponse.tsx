import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '@/types/agent';

interface ChartResponseProps {
  data: ChartData;
}

export function ChartResponse({ data }: ChartResponseProps) {
  const { chartType, data: chartData, xKey, yKey, title } = data;

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xKey} style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xKey} style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Bar dataKey={yKey} fill="#3b82f6" />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xKey} style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip />
            <Area type="monotone" dataKey={yKey} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          </AreaChart>
        );

      default:
        return null;
    }
  };

  const chart = renderChart();
  
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        {chart || <div />}
      </ResponsiveContainer>
    </div>
  );
}
