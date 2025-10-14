// src/WebPage/BrowseFood/ItemList.tsx
import React from "react";
import type { FoodItem } from "./mockData";
import ItemCard from "./ItemCard";

type Props = {
  items: FoodItem[];
  onItemClick: (item: FoodItem) => void;
};

const ItemList: React.FC<Props> = ({ items, onItemClick }) => {
  if (!items || items.length === 0) {
    return (
      <div className="no-items">
        No items found. Please adjust your filters.
      </div>
    );
  }

  return (
    <div className="item-grid">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onView={onItemClick} />
      ))}
    </div>
  );
};

export default ItemList;
