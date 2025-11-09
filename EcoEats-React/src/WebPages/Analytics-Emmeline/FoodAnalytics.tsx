import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, Package, Heart } from 'lucide-react';
import Navbar from "../../components/navbar";
import './foodAnalytics.css';
import { API_BASE_URL } from "../../config";


const COLORS = ['#6EA124', '#5a921e', '#4a7a1a', '#3a6216', '#2a4a12', '#1a3a0e'];

export default function Analytics() {
  const [summary, setSummary] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, selectedCategory, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const summaryParams = new URLSearchParams();
      if (startDate) summaryParams.append('start_date', startDate);
      if (endDate) summaryParams.append('end_date', endDate);
      if (selectedCategory) summaryParams.append('category', selectedCategory);
      
      const summaryRes = await fetch(`${API_BASE_URL}/analytics/summary?${summaryParams}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      const categoryRes = await fetch(`${API_BASE_URL}/analytics/categories?${summaryParams}`);
      const categoryData = await categoryRes.json();
      setCategoryData(categoryData.categories || []);

      const trendsRes = await fetch(`${API_BASE_URL}/analytics/trends?period=${period}`);
      const trendsData = await trendsRes.json();
      setTrends(trendsData.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Items', summary?.totalItems || 0],
      ['Total Donations', summary?.totalDonations || 0],
      ['Total Used', summary?.totalUsed || 0],
      ['Food Saved (kg)', summary?.impactMetrics?.foodSavedKg || 0],
      ['CO2 Saved (kg)', summary?.impactMetrics?.co2SavedKg || 0],
      ['Money Saved ($)', summary?.impactMetrics?.moneySaved || 0],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading analytics...</div>
        </div>
      </>
    );
  }

  if (!summary?.hasData) {
    return (
      <>
        <Navbar />
        <div className="no-data-container">
          <div className="no-data-icon">
            <Package size={64} />
          </div>
          <h2>No Data Yet</h2>
          <p>
            Start adding items to your inventory or making donations to see your food-saving impact!
          </p>
          <button
            onClick={() => window.location.href = '/inventory'}
            className="no-data-btn"
          >
            Go to Inventory
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="analytics-wrapper">
        <div className="analytics-container">
          {/* Header */}
          <div className="analytics-header">
            <h1>Food Analytics Dashboard</h1>
            <button onClick={handleExport} className="export-btn">
              <Download size={20} />
              Export Report
            </button>
          </div>

          {/* Filters */}
          <div className="filters-card">
            <h3>
              <Calendar size={20} />
              Filters
            </h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Meat">Meat</option>
                  <option value="Grains">Grains</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-card-icon icon-green">
                  <Package size={24} />
                </div>
                <h3>Total Items</h3>
              </div>
              <p className="summary-value">{summary.totalItems}</p>
              <p className="summary-subtitle">Items tracked</p>
            </div>
            
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-card-icon icon-green">
                  <Heart size={24} />
                </div>
                <h3>Donations</h3>
              </div>
              <p className="summary-value">{summary.totalDonations}</p>
              <p className="summary-subtitle">Items donated</p>
            </div>
            
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-card-icon icon-green">
                  <TrendingUp size={24} />
                </div>
                <h3>Food Saved</h3>
              </div>
              <p className="summary-value">{summary.impactMetrics.foodSavedKg.toFixed(1)} kg</p>
              <p className="summary-subtitle">Approx. weight saved</p>
            </div>
          </div>

          {/* Impact Banner */}
          <div className="impact-banner">
            <h3>Your Environmental Impact</h3>
            <div className="impact-grid">
              <div className="impact-item">
                <p className="impact-value">{summary.impactMetrics.co2SavedKg.toFixed(1)} kg</p>
                <p className="impact-label">CO₂ Emissions Saved</p>
              </div>
              <div className="impact-item">
                <p className="impact-value">${summary.impactMetrics.moneySaved}</p>
                <p className="impact-label">Money Saved</p>
              </div>
              <div className="impact-item">
                <p className="impact-value">{summary.totalDonations}</p>
                <p className="impact-label">Community Contributions</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Activity Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="inventory" stroke="#6EA124" name="Inventory" strokeWidth={2} />
                  <Line type="monotone" dataKey="donations" stroke="#5a921e" name="Donations" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Category Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Details */}
          <div className="details-card">
            <h3>Category Details</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="used" fill="#6EA124" name="Used" />
                <Bar dataKey="donated" fill="#5a921e" name="Donated" />
                <Bar dataKey="wasted" fill="#dc3545" name="Wasted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}