import React, { useState, useEffect, useContext } from "react";
import { PlusCircle, Loader, XCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RoleToggle from "../components/RoleToggle";
import { UserContext } from "./UserContext";
import { authenticatedFetch } from "../utils/api";
import "../css/InventoryPage.css";

const REQUEST_API = "http://localhost:5000/api/requests";
const CATEGORIES = ["Medical", "Food", "Shelter", "Equipment", "Water"];

const initialFormData = {
  itemName: "",
  category: "",
  quantity: 1,
  location: "",
  priority: "normal",
};

const RefugeePage = () => {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);
  const { token, userId } = useContext(UserContext);

  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    if (role === "admin") navigate("/inventory");
    else if (role === "volunteer") navigate("/volunteer");
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${REQUEST_API}`, {}, token);
      setRequests(await response.json());
    } catch (err) {
      setError(`Failed to load requests: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      setError("User authentication required. Please log in again.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError(null);

    try {
      const requestData = {
        ...formData,
        requesterId: userId
      };

      const res = await authenticatedFetch(REQUEST_API, {
        method: "POST",
        body: JSON.stringify(requestData),
      }, token);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit request");
      }
      
      setMessage(`Request for "${formData.itemName}" submitted!`);
      setFormData(initialFormData);
      fetchRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'delivered': return 'text-blue-600';
      case 'fulfilled': return 'text-purple-600';
      default: return 'text-yellow-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 font-bold';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="inventory-page">
      <RoleToggle currentRole="refugee" onRoleChange={handleRoleChange} />
      <h1>Refugee Request Portal</h1>
      <p className="subtitle">Submit requests for needed items and track their status.</p>

      {isLoading && <div className="status loading"><Loader className="spin" /> Loading...</div>}
      {error && <div className="status error"><XCircle /> {error}</div>}
      {message && <div className="status success"><CheckCircle2 /> {message}</div>}

      {/* Request Submission Form */}
      <section className="inventory-form-section">
        <h2>Submit New Request</h2>
        <form onSubmit={handleSubmit} className="inventory-form">
          <div className="form-grid">
            <FormInput id="itemName" label="Item Name" value={formData.itemName} onChange={handleChange} required />
            <FormSelect id="category" label="Category" value={formData.category} onChange={handleChange} options={CATEGORIES} required />
            <FormInput id="quantity" label="Quantity" type="number" value={formData.quantity} onChange={handleChange} min="1" required />
            <FormInput id="location" label="Location" value={formData.location} onChange={handleChange} required />
            <FormSelect id="priority" label="Priority" value={formData.priority} onChange={handleChange} options={["low", "normal", "high"]} required />
          </div>
          <button type="submit" className="btn primary" disabled={isLoading}>
            <PlusCircle /> Submit Request
          </button>
        </form>
      </section>

      {/* My Requests */}
      <section className="inventory-table-section">
        <h2>My Requests ({requests.length})</h2>
        {requests.length === 0 ? (
          <div className="no-data">No requests submitted yet.</div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Priority</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>{request.itemName}</td>
                  <td>{request.category}</td>
                  <td>{request.quantity}</td>
                  <td>
                    <span className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </span>
                  </td>
                  <td>{request.location}</td>
                  <td>
                    <span className={getStatusColor(request.status)}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

const FormInput = ({ id, label, value, onChange, type = "text", required = false, min }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <input type={type} id={id} value={value} onChange={onChange} required={required} min={min} />
  </div>
);

const FormSelect = ({ id, label, value, onChange, options, required = false }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={onChange} required={required}>
      {/* Handle slightly different option structure if needed, but array of strings is standard here */}
      <option value="" disabled>-- Select --</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

export default RefugeePage;