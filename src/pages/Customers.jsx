import React, { useEffect, useState } from 'react';
import { Search, Upload, FileSpreadsheet, Eye, User, ShoppingBag, Calendar, Check, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, limit: 15 });
  const [loading, setLoading] = useState(false);

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Upload Modal State
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search, location, page, limit: 15 });
      setCustomers(res.data.customers || []);
      setPagination(res.data.pagination || { total: 0, limit: 15 });
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleViewProfile = async (customer) => {
    try {
      setSelectedCustomer(customer);
      setCustomerOrders([]);
      setLoadingProfile(true);
      const res = await api.getCustomerById(customer.id);
      setCustomerOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error fetching customer profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadResult(null);

      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await api.importCustomers(formData);
      setUploadResult(res.data.summary);
      fetchCustomers(); // refresh table
    } catch (err) {
      console.error('CSV Import failed:', err);
      setUploadError(err.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>

          <select
            value={location}
            onChange={(e) => { setLocation(e.target.value); setPage(1); }}
            className="bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="">All Locations</option>
            <option value="New York">New York</option>
            <option value="Chicago">Chicago</option>
            <option value="Los Angeles">Los Angeles</option>
            <option value="Boston">Boston</option>
          </select>

          <button type="submit" className="gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md">
            Apply Filters
          </button>
        </form>

        <button
          onClick={() => { setShowUpload(true); setUploadResult(null); setUploadFile(null); setUploadError(''); }}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-200 text-sm font-semibold transition-all"
        >
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>Import Customer CSV</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Attributes</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No customers found matching filters.
                  </td>
                </tr>
              ) : (
                customers.map(cust => {
                  const attrs = typeof cust.attributes === 'string' ? JSON.parse(cust.attributes) : cust.attributes || {};
                  return (
                    <tr key={cust.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">
                        {cust.first_name} {cust.last_name}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{cust.email}</td>
                      <td className="py-4 px-6 text-slate-400">{cust.phone || '-'}</td>
                      <td className="py-4 px-6 text-slate-300">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-medium">
                          {cust.location || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {attrs.loyalty_tier && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {attrs.loyalty_tier}
                            </span>
                          )}
                          {attrs.gender && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              Gender: {attrs.gender}
                            </span>
                          )}
                          {attrs.interests && Array.isArray(attrs.interests) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300" title={attrs.interests.join(', ')}>
                              {attrs.interests.length} Interests
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleViewProfile(cust)}
                          className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold px-1">View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/10 text-xs text-slate-400">
          <span>Showing Page {page} of {Math.ceil(pagination.total / 15) || 1} ({pagination.total} records total)</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 disabled:opacity-40 disabled:hover:bg-slate-900/40 font-semibold"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(pagination.total / 15)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 disabled:opacity-40 disabled:hover:bg-slate-900/40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Customer Profile detail modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            {/* Title Bar */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">{selectedCustomer.first_name} {selectedCustomer.last_name}</h4>
                  <p className="text-xs text-slate-400">{selectedCustomer.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-500 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Info Card */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/50 pb-1.5">Overview Info</h5>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-slate-200">{selectedCustomer.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Location:</span> <span className="text-slate-200 font-semibold">{selectedCustomer.location || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Joined:</span> <span className="text-slate-200">{new Date(selectedCustomer.created_at).toLocaleDateString()}</span></div>
                  </div>
                </div>

                {/* Attributes Card */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/50 pb-1.5">Custom Attributes</h5>
                  <div className="space-y-2 text-xs">
                    {Object.keys(selectedCustomer.attributes || {}).length === 0 ? (
                      <p className="text-slate-500 italic">No custom attributes assigned.</p>
                    ) : (
                      Object.keys(selectedCustomer.attributes).map(key => (
                        <div key={key} className="flex justify-between">
                          <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-indigo-400 font-semibold">
                            {Array.isArray(selectedCustomer.attributes[key])
                              ? selectedCustomer.attributes[key].join(', ')
                              : String(selectedCustomer.attributes[key])
                            }
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <h5 className="font-bold text-xs text-slate-300 uppercase tracking-wider">Purchase History</h5>
                </div>

                {loadingProfile ? (
                  <div className="py-4 text-center text-slate-500 text-xs">Loading orders...</div>
                ) : customerOrders.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs italic">No orders found for this customer.</div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(order => (
                      <div key={order.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-800/60 bg-slate-900/10 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-200">{order.order_number}</p>
                          <div className="flex items-center text-[10px] text-slate-500 space-x-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(order.order_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-400 text-sm">${parseFloat(order.total_amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-base text-white">Import Customer CSV</h4>
              <button
                onClick={() => setShowUpload(false)}
                className="text-slate-500 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-lg"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="p-6 space-y-6">
              {/* File input drag space */}
              <div className="border border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 bg-slate-950/20 text-center transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-200 mb-1">
                  {uploadFile ? uploadFile.name : 'Click or Drag CSV here'}
                </p>
                <p className="text-[10px] text-slate-500">Supports headers: first_name, last_name, email, phone, location, attributes_gender, attributes_loyalty_tier, order_number, order_total</p>
              </div>

              {/* Status Reports */}
              {uploading && (
                <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Processing CSV imports...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadResult && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold mb-1">
                    <Check className="w-4 h-4" />
                    <span>Upload Finished!</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between"><span>New Customers:</span> <span className="font-semibold text-white">{uploadResult.insertedCustomers}</span></div>
                    <div className="flex justify-between"><span>New Orders:</span> <span className="font-semibold text-white">{uploadResult.insertedOrders}</span></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="w-full gradient-btn py-3 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-40 disabled:pointer-events-none"
              >
                Upload File
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
