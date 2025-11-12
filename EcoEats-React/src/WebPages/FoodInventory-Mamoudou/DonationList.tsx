import React from "react";
import "./DonationList.css";

export interface DonationItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiry: string;
  storage: string;
  status: string;
  notes?: string;
  image?: string;
  pickupLocation?: string;
  availability?: string;
}

interface DonationListProps {
  donations: DonationItem[];
  onClose: () => void;
}

const DonationList: React.FC<DonationListProps> = ({ donations, onClose }) => {
  return (
    <div className="donation-list-wrapper">
      <div className="donation-header">
        <h2>Donations</h2>
        <button className="btn-close" onClick={onClose}>
          Close
        </button>
      </div>

      {donations.length === 0 ? (
        <div className="no-donations">No donations found.</div>
      ) : (
        <table className="donation-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Expiry</th>
              <th>Storage</th>
              <th>Status</th>
              <th>Pickup Location</th>
              <th>Availability</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="donation-row">
                <td>
                  {d.image ? (
                    <img src={d.image} alt={d.name} className="donation-img" />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td>{d.name}</td>
                <td>{d.category}</td>
                <td>{d.quantity}</td>
                <td>{d.expiry}</td>
                <td>{d.storage}</td>
                <td>
                  <span
                    className={`status-badge ${
                      d.status === "Expired"
                        ? "status-expired"
                        : d.status === "Expiring Soon"
                        ? "status-expiring"
                        : "status-fresh"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td>{d.pickupLocation || "-"}</td>
                <td>{d.availability || "-"}</td>
                <td>
                  <button onClick={() => alert("Donated: " + d.name)}>
                    View Donation
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DonationList;