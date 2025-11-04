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

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "inventory",
      icon: <Leaf color="#3BAE3B" size={18} />,
      title: "Your fresh carrots are expiring in 2 days. Plan a meal!",
      time: "2 hours ago",
      action: "View Item",
      read: false,
      link: "/inventory",
    },
    {
      id: 2,
      type: "meal",
      icon: <BookOpen color="#8BC34A" size={18} />,
      title: 'New recipe suggestion: "Lentil Stew" matches your inventory.',
      time: "1 day ago",
      action: "View Recipe",
      read: false,
      link: "/meals",
    },
    {
      id: 3,
      type: "donation",
      icon: <Calendar color="#4CAF50" size={18} />,
      title: "Reminder: Your donation items for Harvest Hub are due tomorrow.",
      time: "Yesterday",
      action: "View Donation",
      read: true,
      link: "/donations",
    },
    {
      id: 4,
      type: "donation",
      icon: <Package color="#777" size={18} />,
      title: "Your food donation to Community Shelter was picked up.",
      time: "2 days ago",
      action: "",
      read: true,
      link: "/donations",
    },
    {
      id: 5,
      type: "system",
      icon: <Info color="#1976D2" size={18} />,
      title: "System Update: New features added to Donation Listing.",
      time: "3 days ago",
      action: "Learn More",
      read: true,
      link: "/system",
    },
    {
      id: 6,
      type: "inventory",
      icon: <Circle color="#888" size={18} />,
      title: "Your eggs are running low. Time to restock!",
      time: "1 week ago",
      action: "Add to List",
      read: false,
      link: "/inventory",
    },
  ]);

  const [activeTab, setActiveTab] = useState("All");

  // Filter notifications by tab
  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.type === activeTab.toLowerCase());

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Mark single notification as read
  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  // Handle navigation (temporary simulation)
  const openNotification = (note: any) => {
    markAsRead(note.id);
    alert(`Redirecting to ${note.link}`);
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