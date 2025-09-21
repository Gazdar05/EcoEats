import React from "react";

type FilterPanelProps = {
  source: "inventory" | "donation";
  setSource: (val: "inventory" | "donation") => void;
  filters: { expiry?: string; category?: string; storage?: string };
  setFilters: (f: any) => void;
  onClear: () => void;
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  source,
  setSource,
  filters,
  setFilters,
  onClear,
}) => {
  return (
    <div className="filter-panel">
      <div className="toggle">
        <button
          className={source === "inventory" ? "active" : ""}
          onClick={() => setSource("inventory")}
        >
          Inventory
        </button>
        <button
          className={source === "donation" ? "active" : ""}
          onClick={() => setSource("donation")}
        >
          Donation Listings
        </button>
      </div>

      <div className="filters">
        <input
          type="date"
          value={filters.expiry || ""}
          onChange={(e) => setFilters({ ...filters, expiry: e.target.value })}
          placeholder="Expiry Date"
        />
        <input
          type="text"
          value={filters.category || ""}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          placeholder="Category"
        />
        <input
          type="text"
          value={filters.storage || ""}
          onChange={(e) => setFilters({ ...filters, storage: e.target.value })}
          placeholder="Storage Type"
        />
        <button onClick={onClear}>Clear Filters</button>
      </div>
    </div>
  );
};

export default FilterPanel;
