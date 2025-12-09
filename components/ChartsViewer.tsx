import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  chartType: 'bar' | 'line' | 'pie' | 'table';
  title: string;
  description: string;
  data: Array<{ label: string; value: number }>;
  labels: string[];
}

interface ChartsViewerProps {
  charts: ChartData[];
  onClose: () => void;
}

const COLORS = ['#0d9488', '#6366f1', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

const ChartsViewer: React.FC<ChartsViewerProps> = ({ charts, onClose }) => {
  const [currentChartIndex, setCurrentChartIndex] = useState(0);

  if (charts.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-up border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Charts Available</h3>
          <p className="text-slate-600 mb-6">No visualizable data was found in the document. Try selecting a document with numerical data.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentChart = charts[currentChartIndex];

  const renderChart = () => {
    switch (currentChart.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={currentChart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0d9488" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={currentChart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0d9488" name="Value" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={currentChart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {currentChart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'table':
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {currentChart.data.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="border border-slate-200 px-4 py-2 font-medium text-slate-900">{row.label}</td>
                    <td className="border border-slate-200 px-4 py-2 text-right text-slate-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
      <div className="bg-white w-full h-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-up border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{currentChart.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{currentChart.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Chart */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {renderChart()}
        </div>

        {/* Footer with Navigation */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button
            onClick={() => setCurrentChartIndex(Math.max(0, currentChartIndex - 1))}
            disabled={currentChartIndex === 0}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className="text-sm text-slate-600">
            Chart {currentChartIndex + 1} of {charts.length}
          </div>

          <button
            onClick={() => setCurrentChartIndex(Math.min(charts.length - 1, currentChartIndex + 1))}
            disabled={currentChartIndex === charts.length - 1}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartsViewer;
