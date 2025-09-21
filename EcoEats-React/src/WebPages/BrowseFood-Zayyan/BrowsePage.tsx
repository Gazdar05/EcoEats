import React, { useState } from "react";
import { sampleItems } from "./mockData";
import type { FoodItem } from "./mockData";
import FilterPanel from "./FilterPanel";
import ItemList from "./ItemList";
import ItemDetailModal from "./ItemDetailModal";
import "./BrowseFood.css";

const BrowsePage: React.FC = () => {
  const [source, setSource] = useState<"inventory" | "donation">("inventory");
  const [filters, setFilters] = useState<any>({});
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);

  // apply filters
  const filteredItems = sampleItems.filter(
    (i) =>
      i.source === source &&
      (!filters.expiry || i.expiry === filters.expiry) &&
      (!filters.category ||
        i.category.toLowerCase().includes(filters.category.toLowerCase())) &&
      (!filters.storage ||
        i.storage.toLowerCase().includes(filters.storage.toLowerCase()))
  );

  const handleClear = () => setFilters({});

  const handleUpdateStatus = (id: string, status: string) => {
    alert(`Item ${id} updated with status: ${status}`);
    setSelectedItem(null);
  };

  return (
    <div className="browse-page">
      <h1>Browse Food Items</h1>
      <FilterPanel
        source={source}
        setSource={setSource}
        filters={filters}
        setFilters={setFilters}
        onClear={handleClear}
      />
      <ItemList items={filteredItems} onItemClick={setSelectedItem} />
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default BrowsePage;
