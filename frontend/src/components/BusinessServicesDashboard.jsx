import { useEffect, useState } from 'react';
import './BusinessServicesDashboard.css';

function getBusinessIdFromURL() {
    const u = new URL(window.location.href);
    return u.searchParams.get('businessId') || 'royalHairStudio';
}

export default function BusinessServicesDashboard() {
    const businessId = getBusinessIdFromURL();
    const [summary, setSummary] = useState({ 
        total: 0, 
        active: 0, 
        featured: 0, 
        averagePrice: 0, 
        visible: 0 
    });
    const [list, setList] = useState([]);
    const [selected, setSelected] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [summaryRes, listRes] = await Promise.all([
                fetch(`/api/services/summary?businessId=${businessId}`),
                fetch(`/api/services/list?businessId=${businessId}`)
            ]);
            
            const summaryData = await summaryRes.json();
            const listData = await listRes.json();
            
            if (summaryData.success) {
                setSummary(summaryData);
            }
            setList(listData);
            setError(null);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load services data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 60000); // Refresh every 60 seconds
        return () => clearInterval(interval);
    }, [businessId]);

    const toggleSelect = (id) => {
        setSelected(prev => 
            prev.includes(id) 
                ? prev.filter(x => x !== id) 
                : [...prev, id]
        );
    };

    const handleCreate = async (payload) => {
        try {
            const response = await fetch('/api/services/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, ...payload })
            });
            
            const result = await response.json();
            if (result.success) {
                setShowAdd(false);
                fetchAll();
            } else {
                alert('Failed to create service: ' + result.error);
            }
        } catch (err) {
            console.error('Error creating service:', err);
            alert('Failed to create service');
        }
    };

    const handleInlineUpdate = async (serviceId, patch) => {
        try {
            const response = await fetch('/api/services/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, ...patch })
            });
            
            const result = await response.json();
            if (result.success) {
                fetchAll();
            } else {
                alert('Failed to update service: ' + result.error);
            }
        } catch (err) {
            console.error('Error updating service:', err);
            alert('Failed to update service');
        }
    };

    const handleBulk = async (patch) => {
        try {
            const response = await fetch('/api/services/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, serviceIds: selected, patch })
            });
            
            const result = await response.json();
            if (result.success) {
                setShowBulk(false);
                setSelected([]);
                fetchAll();
            } else {
                alert('Failed to bulk update services: ' + result.error);
            }
        } catch (err) {
            console.error('Error bulk updating services:', err);
            alert('Failed to bulk update services');
        }
    };

    const handleDelete = async (serviceId) => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        
        try {
            const response = await fetch(`/api/services/delete?serviceId=${serviceId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            if (result.success) {
                fetchAll();
            } else {
                alert('Failed to delete service: ' + result.error);
            }
        } catch (err) {
            console.error('Error deleting service:', err);
            alert('Failed to delete service');
        }
    };

    if (loading) {
        return (
            <div className="services-dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading services...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="services-dashboard">
                <div className="error-container">
                    <h3>Error Loading Services</h3>
                    <p>{error}</p>
                    <button onClick={fetchAll} className="retry-btn">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="services-dashboard">
            <div className="dashboard-header">
                <h2>Service Management</h2>
                <p>Manage your business services, pricing, and availability</p>
            </div>

            <div className="stats-grid">
                <Stat title="Total Services" value={summary.total} />
                <Stat title="Active Services" value={summary.active} />
                <Stat title="Featured Services" value={summary.featured} />
                <Stat title="Average Price" value={`£${summary.averagePrice.toFixed(2)}`} />
                <Stat title="Visible Services" value={summary.visible} />
            </div>

            <div className="quick-actions">
                <button 
                    className="action-btn primary" 
                    onClick={() => setShowAdd(true)}
                >
                    + Add New Service
                </button>
                <button 
                    className="action-btn secondary" 
                    onClick={() => setShowBulk(true)} 
                    disabled={!selected.length}
                >
                    Bulk Edit ({selected.length})
                </button>
                <button 
                    className="action-btn tertiary" 
                    onClick={() => setSelected([])}
                    disabled={!selected.length}
                >
                    Clear Selection
                </button>
            </div>

            <div className="services-table-container">
                <table className="services-table">
                    <thead>
                        <tr>
                            <th className="checkbox-col">
                                <input 
                                    type="checkbox" 
                                    checked={selected.length === list.length && list.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelected(list.map(s => s._id));
                                        } else {
                                            setSelected([]);
                                        }
                                    }}
                                />
                            </th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Duration</th>
                            <th>Price</th>
                            <th>Active</th>
                            <th>Featured</th>
                            <th>Published</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="empty-state">
                                    <div className="empty-content">
                                        <div className="empty-icon">📋</div>
                                        <h3>No Services Yet</h3>
                                        <p>Add your first service to get started</p>
                                        <button 
                                            className="action-btn primary"
                                            onClick={() => setShowAdd(true)}
                                        >
                                            Add Service
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            list.map(service => (
                                <tr key={service._id} className={selected.includes(service._id) ? 'selected' : ''}>
                                    <td className="checkbox-col">
                                        <input 
                                            type="checkbox" 
                                            checked={selected.includes(service._id)}
                                            onChange={() => toggleSelect(service._id)}
                                        />
                                    </td>
                                    <td className="name-col">
                                        <input 
                                            type="text" 
                                            value={service.name}
                                            onChange={(e) => handleInlineUpdate(service._id, { name: e.target.value })}
                                            className="inline-input"
                                        />
                                    </td>
                                    <td className="category-col">
                                        <input 
                                            type="text" 
                                            value={service.category || ''}
                                            onChange={(e) => handleInlineUpdate(service._id, { category: e.target.value })}
                                            className="inline-input"
                                            placeholder="Category"
                                        />
                                    </td>
                                    <td className="duration-col">
                                        <div className="duration-input">
                                            <input 
                                                type="number" 
                                                value={service.durationMinutes}
                                                onChange={(e) => handleInlineUpdate(service._id, { durationMinutes: Number(e.target.value) })}
                                                className="inline-input number"
                                                min="1"
                                            />
                                            <span>min</span>
                                        </div>
                                    </td>
                                    <td className="price-col">
                                        <div className="price-input">
                                            <span>£</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={service.priceGBP}
                                                onChange={(e) => handleInlineUpdate(service._id, { priceGBP: Number(e.target.value) })}
                                                className="inline-input number"
                                                min="0"
                                            />
                                        </div>
                                    </td>
                                    <td className="status-col">
                                        <label className="toggle">
                                            <input 
                                                type="checkbox" 
                                                checked={service.active}
                                                onChange={(e) => handleInlineUpdate(service._id, { active: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td className="status-col">
                                        <label className="toggle">
                                            <input 
                                                type="checkbox" 
                                                checked={service.featured}
                                                onChange={(e) => handleInlineUpdate(service._id, { featured: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td className="status-col">
                                        <label className="toggle">
                                            <input 
                                                type="checkbox" 
                                                checked={service.published}
                                                onChange={(e) => handleInlineUpdate(service._id, { published: e.target.checked })}
                                            />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </td>
                                    <td className="actions-col">
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDelete(service._id)}
                                            title="Delete service"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <AddServiceModal 
                    businessId={businessId} 
                    onClose={() => setShowAdd(false)} 
                    onCreate={handleCreate} 
                />
            )}
            {showBulk && (
                <BulkEditModal 
                    onClose={() => setShowBulk(false)} 
                    onApply={handleBulk}
                    selectedCount={selected.length}
                />
            )}
        </div>
    );
}

function Stat({ title, value }) {
    return (
        <div className="stat">
            <h4>{title}</h4>
            <p>{value}</p>
        </div>
    );
}

function AddServiceModal({ businessId, onClose, onCreate }) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: '',
        durationMinutes: 30,
        priceGBP: 0,
        active: true,
        featured: false,
        published: true
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || form.priceGBP < 0 || form.durationMinutes <= 0) {
            alert('Please fill in all required fields correctly');
            return;
        }

        setLoading(true);
        try {
            await onCreate(form);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-card">
                <div className="modal-header">
                    <h3>Add New Service</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Service Name *</label>
                        <input 
                            type="text" 
                            value={form.name}
                            onChange={(e) => setForm({...form, name: e.target.value})}
                            placeholder="e.g., Hair Cut & Style"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Description</label>
                        <textarea 
                            value={form.description}
                            onChange={(e) => setForm({...form, description: e.target.value})}
                            placeholder="Describe your service..."
                            rows="3"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Category</label>
                        <input 
                            type="text" 
                            value={form.category}
                            onChange={(e) => setForm({...form, category: e.target.value})}
                            placeholder="e.g., Hair & Beauty"
                        />
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Duration (minutes) *</label>
                            <input 
                                type="number" 
                                value={form.durationMinutes}
                                onChange={(e) => setForm({...form, durationMinutes: Number(e.target.value)})}
                                min="1"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Price (£) *</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={form.priceGBP}
                                onChange={(e) => setForm({...form, priceGBP: Number(e.target.value)})}
                                min="0"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="form-checkboxes">
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={form.active}
                                onChange={(e) => setForm({...form, active: e.target.checked})}
                            />
                            <span className="checkmark"></span>
                            Active (available for booking)
                        </label>
                        
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={form.featured}
                                onChange={(e) => setForm({...form, featured: e.target.checked})}
                            />
                            <span className="checkmark"></span>
                            Featured (highlighted on profile)
                        </label>
                        
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                checked={form.published}
                                onChange={(e) => setForm({...form, published: e.target.checked})}
                            />
                            <span className="checkmark"></span>
                            Published (visible to customers)
                        </label>
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Service'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BulkEditModal({ onClose, onApply, selectedCount }) {
    const [patch, setPatch] = useState({
        priceGBP: '',
        durationMinutes: '',
        active: null,
        featured: null,
        published: null,
        category: ''
    });
    const [loading, setLoading] = useState(false);

    const cleanPatch = () => {
        const p = {};
        if (patch.priceGBP !== '') p.priceGBP = Number(patch.priceGBP);
        if (patch.durationMinutes !== '') p.durationMinutes = Number(patch.durationMinutes);
        ['active', 'featured', 'published', 'category'].forEach(field => {
            if (patch[field] !== null && patch[field] !== '') p[field] = patch[field];
        });
        return p;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanPatchData = cleanPatch();
        if (Object.keys(cleanPatchData).length === 0) {
            alert('Please select at least one field to update');
            return;
        }

        setLoading(true);
        try {
            await onApply(cleanPatchData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-card">
                <div className="modal-header">
                    <h3>Bulk Edit Services ({selectedCount} selected)</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Price (£)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                value={patch.priceGBP}
                                onChange={(e) => setPatch({...patch, priceGBP: e.target.value})}
                                placeholder="Leave empty for no change"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Duration (minutes)</label>
                            <input 
                                type="number" 
                                value={patch.durationMinutes}
                                onChange={(e) => setPatch({...patch, durationMinutes: e.target.value})}
                                placeholder="Leave empty for no change"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>Category</label>
                        <input 
                            type="text" 
                            value={patch.category}
                            onChange={(e) => setPatch({...patch, category: e.target.value})}
                            placeholder="Leave empty for no change"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Active Status</label>
                        <select 
                            value={patch.active ?? ''} 
                            onChange={(e) => setPatch({...patch, active: e.target.value === '' ? null : (e.target.value === 'true')})}
                        >
                            <option value="">No change</option>
                            <option value="true">Set to Active</option>
                            <option value="false">Set to Inactive</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Featured Status</label>
                        <select 
                            value={patch.featured ?? ''} 
                            onChange={(e) => setPatch({...patch, featured: e.target.value === '' ? null : (e.target.value === 'true')})}
                        >
                            <option value="">No change</option>
                            <option value="true">Set to Featured</option>
                            <option value="false">Remove from Featured</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Published Status</label>
                        <select 
                            value={patch.published ?? ''} 
                            onChange={(e) => setPatch({...patch, published: e.target.value === '' ? null : (e.target.value === 'true')})}
                        >
                            <option value="">No change</option>
                            <option value="true">Set to Published</option>
                            <option value="false">Set to Unpublished</option>
                        </select>
                    </div>
                    
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Apply Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
