import React from "react";
import type { FoodItem } from "./mockData";

type Props = {
  item: FoodItem;
  onClick: (item: FoodItem) => void;
};

const ItemCard: React.FC<Props> = ({ item, onClick }) => {
  return (
    <div className="item-card" onClick={() => onClick(item)}>
      <h3>{item.name}</h3>
      <p>Expiry: {item.expiry}</p>
      <p>Category: {item.category}</p>
      <p>Quantity: {item.quantity}</p>
    </div>
  );
};

export default ItemCard;
