import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Calendar, TrendingUp, Package, Heart } from "lucide-react";
import Navbar from "../../components/navbar";
import "./foodAnalytics.css";
import { API_BASE_URL } from "../../config";

const COLORS = [
  "#6EA124", // EcoEats Green
  "#14a0ecff", // EcoEats Blue (for Donations)
  "#e0a31fff", // Yellow/Orange
  "#8E44AD", // Purple
  "#3498DB", // Light Blue
  "#1ABC9C", // Turquoise
  "#846e15ff", // Bright Yellow
  "#E67E22", // Carrot Orange
  "#2ECC71", // Emerald
  "#E74C3C", // Alizarin Red
  "#9B59B6", // Amethyst
  "#dc3545", // Wasted Red
];

export default function FoodAnalytics() {
  const [summary, setSummary] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  useEffect(() => {
    fetchAnalytics();
    fetchCategories();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate date inputs
      if ((startDate && !endDate) || (!startDate && endDate)) {
        setError("Please provide both start and end dates");
        setLoading(false);
        return;
      }

      // Validate date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          setError("Invalid date format. Please use a valid date.");
          setLoading(false);
          return;
        }

        if (start > end) {
          setError("Start date must be before end date");
          setLoading(false);
          return;
        }

        // Check if dates are in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (end > today) {
          setError("End date cannot be in the future");
          setLoading(false);
          return;
        }
      }

      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (selectedCategory) params.append("category", selectedCategory);

      // Summary
      const summaryRes = await fetch(
        `${API_BASE_URL}/analytics/summary?${params}`
      );
      if (!summaryRes.ok) throw new Error("Failed to fetch summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // Categories
      const categoryRes = await fetch(
        `${API_BASE_URL}/analytics/categories?${params}`
      );
      if (!categoryRes.ok) throw new Error("Failed to fetch categories");
      const categoryDataRaw = await categoryRes.json();
      const catData = Object.entries(
        categoryDataRaw.categoriesBreakdown || {}
      ).map(([name, data]: any) => ({
        name,
        total: data.total,
        donated: data.donated,
        used: data.used,
        wasted: data.wasted,
      }));
      setCategoryData(catData);

      // Trends
      const trendsParams = new URLSearchParams();
      trendsParams.append("period", period);
      if (startDate) trendsParams.append("start_date", startDate);
      if (endDate) trendsParams.append("end_date", endDate);
      if (selectedCategory) trendsParams.append("category", selectedCategory);

      const trendsRes = await fetch(
        `${API_BASE_URL}/analytics/trends?${trendsParams}`
      );
      if (!trendsRes.ok) throw new Error("Failed to fetch trends");
      const trendsData = await trendsRes.json();

      // Map backend field names (period/saved/donated/wasted) into frontend fields
      const trendFormatted = (trendsData.trend || []).map((t: any) => ({
        date: t.period,
        inventory: t.saved,
        donations: t.donated,
        wasted: t.wasted || 0,
      }));
      setTrends(trendFormatted);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/categories`);
      if (!res.ok) return;
      const data = await res.json();
      setCategoriesList(Object.keys(data.categoriesBreakdown || {}));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyFilters = () => fetchAnalytics();

  const handleExport = () => {
    const csv = [
      ["Metric", "Value"],
      ["Total Items", summary?.totalItems || 0],
      ["Total Donations", summary?.totalDonations || 0],
      ["Total Used", summary?.totalUsed || 0],
      ["Food Saved (kg)", summary?.impactMetrics?.foodSavedKg || 0],
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecoEats-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  if (loading)
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button
            className="retry-btn"
            onClick={() => (window.location.href = "/analytics")}
          >
            Retry
          </button>
        </div>
      </>
    );

  if (!summary?.hasData)
    return (
      <>
        <Navbar />
        <div className="no-data-container">
          <Package size={64} />
          <h2>No Data Found</h2>
          <p>Start adding inventory or donations to see your analytics!</p>
          <button
            className="no-data-btn"
            onClick={() => (window.location.href = "/inventory")}
          >
            Go to Inventory
          </button>
        </div>
      </>
    );

  return (
    <>
      <Navbar />
      <div className="analytics-wrapper">
        <div className="analytics-container">
          {/* Header */}
          <div className="analytics-header">
            <h1>EcoEats Food Analytics</h1>
            <button onClick={handleExport} className="export-btn">
              <Download size={18} /> Export
            </button>
          </div>

          {/* Filters */}
          <div className="filters-card">
            <h3>
              <Calendar size={18} /> Filters
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
                  <option value="">All</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
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
            <div className="apply-filters-btn-wrapper">
              <button onClick={handleApplyFilters} className="apply-btn">
                Apply
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <Package className="summary-icon" />
              <h3>Total Items</h3>
              <p className="summary-value">{summary.totalItems}</p>
            </div>
            <div className="summary-card">
              <Heart className="summary-icon" />
              <h3>Donations</h3>
              <p className="summary-value">{summary.totalDonations}</p>
            </div>
            <div className="summary-card">
              <TrendingUp className="summary-icon" />
              <h3>Food Saved</h3>
              <p className="summary-value">
                {summary.impactMetrics.foodSavedKg.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* Trend Line */}
            <div className="chart-card">
              <h3>Activity Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inventory"
                    stroke="#6EA124"
                    name="Used"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="donations"
                    stroke="#1460ecff"
                    name="Donations"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="wasted"
                    stroke="#dc3545"
                    name="Wasted"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown Pie */}
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
                    outerRadius={90}
                    label
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Details BarChart */}
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
                <Bar dataKey="donated" fill="#1460ecff" name="Donated" />
                <Bar dataKey="wasted" fill="#dc3545" name="Wasted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
