'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { alertsApi, incidentsApi, api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { AlertTriangle, CheckCircle, Clock, XCircle, Filter, User, Shield, X } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  sourceIp: string;
  username: string;
  hostname: string;
  createdAt: string;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const severityColors = {
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const statusColors = {
  NEW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ACKNOWLEDGED: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  INVESTIGATING: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  RESOLVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  FALSE_POSITIVE: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '' });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showInvestigateModal, setShowInvestigateModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [investigationNote, setInvestigationNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { isAdmin, isAnalyst, canUpdateAlerts } = usePermissions();

  useEffect(() => {
    fetchAlerts();
    fetchUsers();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const params: any = {};
      if (filter.status) params.status = filter.status;
      if (filter.severity) params.severity = filter.severity;
      
      const response = await alertsApi.getAll(params);
      setAlerts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log('Users fetched:', response.data);
      setAvailableUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Fallback: try using fetch directly
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.data || []);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    }
  };

  const handleAssign = async (alertId: string) => {
    if (!selectedUser) {
      alert('Please select a user to assign');
      return;
    }

    setActionLoading(true);
    try {
      await alertsApi.update(alertId, { assignedToId: selectedUser });
      await fetchAlerts();
      setShowAssignModal(false);
      setSelectedUser('');
      setSelectedAlert(null);
      alert('Alert assigned successfully!');
    } catch (error) {
      console.error('Failed to assign alert:', error);
      alert('Failed to assign alert. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvestigate = async (alertId: string) => {
    if (!investigationNote) {
      alert('Please add an investigation note');
      return;
    }

    setActionLoading(true);
    try {
      // Update alert status to INVESTIGATING
      await alertsApi.update(alertId, { 
        status: 'INVESTIGATING' 
      });
      
      // Create an incident from the alert
      const selectedAlert = alerts.find(a => a.id === alertId);
      await incidentsApi.create({
        title: `Investigation: ${selectedAlert?.title || 'Security Alert'}`,
        description: investigationNote,
        severity: selectedAlert?.severity || 'MEDIUM',
        category: 'Investigation',
      });
      
      await fetchAlerts();
      setShowInvestigateModal(false);
      setInvestigationNote('');
      setSelectedAlert(null);
      alert('Investigation started! Incident created.');
    } catch (error) {
      console.error('Failed to start investigation:', error);
      alert('Failed to start investigation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    return severityColors[severity as keyof typeof severityColors] || severityColors.LOW;
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.NEW;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Clock className="w-4 h-4" />;
      case 'ACKNOWLEDGED':
        return <AlertTriangle className="w-4 h-4" />;
      case 'INVESTIGATING':
        return <Clock className="w-4 h-4" />;
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'FALSE_POSITIVE':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Alerts</h1>
            <p className="text-gray-400 mt-1">View and manage security alerts</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
            {isAnalyst && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <User className="w-3 h-3" />
                Analyst
              </span>
            )}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filters:</span>
            </div>
            
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="NEW">New</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>

            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="bg-gray-800 text-gray-300 rounded-lg px-3 py-1.5 text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Severity</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <button
              onClick={() => setFilter({ status: '', severity: '' })}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <div className="text-gray-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No alerts found</p>
                <p className="text-sm mt-2">Alerts will appear here when detection rules are triggered</p>
              </div>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(alert.status)}`}>
                        {getStatusIcon(alert.status)}
                        {alert.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <h3 className="text-white font-medium mb-1">{alert.title}</h3>
                    <p className="text-gray-400 text-sm">{alert.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      {alert.sourceIp && (
                        <span>Source IP: {alert.sourceIp}</span>
                      )}
                      {alert.username && (
                        <span>User: {alert.username}</span>
                      )}
                      {alert.hostname && (
                        <span>Host: {alert.hostname}</span>
                      )}
                      {alert.assignedTo && (
                        <span>Assigned to: {alert.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Role-based action buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    {canUpdateAlerts && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowInvestigateModal(true);
                          }}
                          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Investigate
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowAssignModal(true);
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          Assign
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        Delete
                      </button>
                    )}
                    {!canUpdateAlerts && !isAdmin && (
                      <span className="text-xs text-gray-500">Read only</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && selectedAlert && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Assign Alert</h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAlert(null);
                    setSelectedUser('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">
                Assign "{selectedAlert.title}" to a team member
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign to:
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a user...</option>
                    {availableUsers.length === 0 ? (
                      <option disabled>No users available</option>
                    ) : (
                      availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableUsers.length} users available
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleAssign(selectedAlert.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAlert(null);
                    setSelectedUser('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Investigate Modal */}
        {showInvestigateModal && selectedAlert && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Investigate Alert</h2>
                <button
                  onClick={() => {
                    setShowInvestigateModal(false);
                    setSelectedAlert(null);
                    setInvestigationNote('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">
                Starting investigation for: {selectedAlert.title}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Investigation Notes:
                  </label>
                  <textarea
                    value={investigationNote}
                    onChange={(e) => setInvestigationNote(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
                    placeholder="Describe your investigation steps..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleInvestigate(selectedAlert.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Starting...' : 'Start Investigation'}
                </button>
                <button
                  onClick={() => {
                    setShowInvestigateModal(false);
                    setSelectedAlert(null);
                    setInvestigationNote('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}