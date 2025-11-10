import React, { useState } from "react";
import "./Notifications.css";
import {
  Leaf,
  BookOpen,
  Calendar,
  Package,
  Info,
  Circle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "inventory",
      icon: <Leaf color="#3BAE3B" size={18} />,
      title: "Your fresh carrots are expiring in 2 days. Plan a meal!",
      time: "2 hours ago",
      action: "View Item",
      read: false,
    },
    {
      id: 2,
      type: "meal",
      icon: <BookOpen color="#8BC34A" size={18} />,
      title: 'New recipe suggestion: "Lentil Stew" matches your inventory.',
      time: "1 day ago",
      action: "View Recipe",
      read: false,
    },
    {
      id: 3,
      type: "donation",
      icon: <Calendar color="#4CAF50" size={18} />,
      title: "Reminder: Your donation items for Harvest Hub are due tomorrow.",
      time: "Yesterday",
      action: "View Donation",
      read: true,
    },
    {
      id: 4,
      type: "donation",
      icon: <Package color="#777" size={18} />,
      title: "Your food donation to Community Shelter was picked up.",
      time: "2 days ago",
      action: "",
      read: true,
    },
    {
      id: 5,
      type: "system",
      icon: <Info color="#1976D2" size={18} />,
      title: "System Update: New features added to Donation Listing.",
      time: "3 days ago",
      action: "Learn More",
      read: true,
    },
    {
      id: 6,
      type: "inventory",
      icon: <Circle color="#888" size={18} />,
      title: "Your eggs are running low. Time to restock!",
      time: "1 week ago",
      action: "Add to List",
      read: false,
    },
  ]);

  const [activeTab, setActiveTab] = useState("All");

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.type === activeTab.toLowerCase());

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // ✅ Smart routing for different actions
  const openNotification = (note: any) => {
    markAsRead(note.id);
    if (note.action === "Add to List") {
      navigate("/inventory?action=add");
    } else if (note.action === "View Item") {
      navigate(`/inventory?action=view&id=${note.id}`);
    } else if (note.action === "View Donation") {
      navigate("/inventory?action=donations");
    } else if (note.action === "View Recipe") {
      navigate("/meals");
    } else {
      navigate("/notifications");
    }
  };

  return (
    <div className="notifications-wrapper">
      <h2 className="notif-title">Notifications</h2>

      <div className="notif-actions">
        <button className="mark-all" onClick={markAllAsRead}>
          Mark all read
        </button>
        <button className="clear-all" onClick={() => setNotifications([])}>
          Clear all
        </button>
      </div>

      <div className="notif-tabs">
        {["All", "Inventory", "Meal", "Donation", "System"].map((tab) => (
          <button
            key={tab}
            className={`notif-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="notif-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifs">No new notifications.</div>
        ) : (
          filteredNotifications.map((note) => (
            <div
              key={note.id}
              className={`notif-item ${note.read ? "read" : "unread"}`}
              onClick={() => openNotification(note)}
            >
              <div className="notif-icon">{note.icon}</div>
              <div className="notif-content">
                <p className="notif-text">{note.title}</p>
                <span className="notif-time">{note.time}</span>
              </div>
              {note.action && (
                <button
                  className="notif-btn"
                  style={{ backgroundColor: "#6EA124", color: "white" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openNotification(note);
                  }}
                >
                  {note.action}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;