import React from "react";
import type { FoodItem } from "./mockData";
import ItemCard from "./ItemCard";

type Props = {
  items: FoodItem[];
  onItemClick: (item: FoodItem) => void;
};

const ItemList: React.FC<Props> = ({ items, onItemClick }) => {
  if (items.length === 0) {
    return <p>No items found. Please adjust your filters.</p>;
  }
  return (
    <div className="item-list">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  );
};

export default ItemList;
