import React, { useState, useEffect } from "react";
import "./Notifications.css";
import { Leaf, BookOpen, Calendar, Info, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000"; // FastAPI backend

interface BackendNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  show_action?: boolean;
  action_label?: string;
  action_link?: string;
}

interface FrontendNotification extends BackendNotification {
  icon: React.ReactNode;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<FrontendNotification[]>([]);
  const [activeTab, setActiveTab] = useState("All");

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/`);
      const data: BackendNotification[] = await res.json();

      const mapped: FrontendNotification[] = data
        .filter((n) => !n.is_read)
        .map((n) => {
          const isExpiring =
            n.title?.toLowerCase().includes("expiring") ||
            n.title?.toLowerCase().includes("expired");

          // Automatically set donation notifications to open DonationList page
          const actionLink =
            n.type === "donation" ? "/food-inventory?action=donations" : n.action_link || n.link || "";

          const actionLabel = n.type === "donation" ? "View Donation" : n.action_label || "Learn More";

          return {
            ...n,
            icon:
              n.type === "inventory"
                ? <Leaf color="#3BAE3B" size={18} />
                : n.type === "meal"
                ? <BookOpen color="#8BC34A" size={18} />
                : n.type === "donation"
                ? <Calendar color="#4CAF50" size={18} />
                : n.type === "system"
                ? <Info color="#1976D2" size={18} />
                : <Circle color="#888" size={18} />,
            show_action: !isExpiring && n.show_action !== false,
            action_label: actionLabel,
            action_link: actionLink,
          };
        });

      setNotifications(mapped);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const markAsReadBackend = async (id: string) => {
    try {
      await fetch(`${API_BASE}/notifications/${id}/mark_read`, { method: "POST" });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const openNotification = (note: FrontendNotification) => {
    if (!note.is_read) {
      markAsReadBackend(note.id);
      setNotifications((prev) => prev.filter((n) => n.id !== note.id));
    }

    if (note.show_action && note.action_link) {
      navigate(note.action_link);
    }
  };

  const markAllAsRead = async () => {
    await Promise.all(notifications.map((n) => markAsReadBackend(n.id)));
    setNotifications([]);
  };

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.type === activeTab.toLowerCase());

  return (
    <div className="notifications-wrapper">
      <h2 className="notif-title">Notifications</h2>

      <div className="notif-actions">
        <button className="mark-all" onClick={markAllAsRead}>Mark all read</button>
        <button className="clear-all" onClick={() => setNotifications([])}>Clear all</button>
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
              className={`notif-item ${note.is_read ? "read" : "unread"}`}
              onClick={() => openNotification(note)}
            >
              <div className="notif-icon">{note.icon}</div>
              <div className="notif-content">
                <p className="notif-text">{note.title}</p>
                <span className="notif-time">{new Date(note.created_at).toLocaleString()}</span>
              </div>
              {note.show_action && note.action_label && (
                <button
                  className="notif-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openNotification(note);
                  }}
                >
                  {note.action_label}
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