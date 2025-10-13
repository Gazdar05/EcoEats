import React, { useEffect } from "react";
import "./DonationList.css";

export interface DonationItem {
  id: number; // ✅ ensure ID is a number
  name: string;
  category: string;
  quantity: string;
  expiry: string;
  storage: string;
  status: string;
  pickupLocation?: string;
  pickupDate?: string;
  availability?: string;
}

interface DonationListProps {
  donations: DonationItem[];
  onClose: () => void;
}

const DonationList: React.FC<DonationListProps> = ({ donations, onClose }) => {
  // Add class to body when popup is open to hide background scroll and navbar/footer
  useEffect(() => {
    document.body.classList.add("popup-open");
    return () => {
      document.body.classList.remove("popup-open");
    };
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Prevent clicks inside modal from closing it
  const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div className="donation-popup-overlay" onClick={onClose}>
      <div className="donation-popup-container" onClick={stopPropagation}>
        <div className="donation-popup-header">
          <h2>Donation Listings</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="donation-popup-content">
          {donations.length > 0 ? (
            <table className="donation-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Expiry</th>
                  <th>Storage</th>
                  <th>Status</th>
                  <th>Availability</th>
                  <th>Pickup Location</th>
                  <th>Pickup Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.expiry}</td>
                    <td>{item.storage}</td>
                    <td>{item.status}</td>
                    <td>{item.availability || "Available"}</td>
                    <td>{item.pickupLocation || "-"}</td>
                    <td>{item.pickupDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-donations">No donations available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationList;