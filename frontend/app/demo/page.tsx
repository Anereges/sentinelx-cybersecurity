'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Shield, User, Eye, Zap } from 'lucide-react';

export default function DemoPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // ✅ FIXED: Each role has its OWN credentials
  const demoCredentials = {
    admin: { 
      email: '19x@sentinelx.local', 
      password: 'Hacker@19', 
      label: 'Administrator' 
    },
    analyst: { 
      email: 'sarah.johnson@sentinelx.local', 
      password: 'Analyst123!', 
      label: 'Security Analyst' 
    },
    viewer: { 
      email: 'james.miller@sentinelx.local', 
      password: 'Viewer123!', 
      label: 'Viewer' 
    },
  };

  const handleDemoLogin = async (role: 'admin' | 'analyst' | 'viewer') => {
    const creds = demoCredentials[role];
    setLoading(role);
    try {
      await login(creds.email, creds.password);
      router.push('/dashboard');
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo login failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">SX</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">SentinelX Demo</h1>
          <p className="text-gray-400 mt-2">Experience the Security Operations Center platform</p>
          <div className="mt-4 inline-block px-4 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm">
            🚀 Demo Mode — No registration required
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Role */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-red-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Administrator</h3>
                  <p className="text-xs text-gray-400">Full System Access</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Manage users & roles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Full alert management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Configure detection rules</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>View audit logs</span>
              </div>
            </div>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading === 'admin'}
              className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'admin' ? 'Loading...' : 'Try as Admin'}
            </button>
          </div>

          {/* Analyst Role */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Security Analyst</h3>
                  <p className="text-xs text-gray-400">Incident Response</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>View and investigate alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Create and manage incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Threat hunting</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Assign alerts to team</span>
              </div>
            </div>
            <button
              onClick={() => handleDemoLogin('analyst')}
              disabled={loading === 'analyst'}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'analyst' ? 'Loading...' : 'Try as Analyst'}
            </button>
          </div>

          {/* Viewer Role */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Viewer</h3>
                  <p className="text-xs text-gray-400">Read-Only Access</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>View dashboards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>View alerts and incidents</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Threat hunting</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <XCircle className="w-4 h-4" />
                <span className="line-through">Can't take actions</span>
              </div>
            </div>
            <button
              onClick={() => handleDemoLogin('viewer')}
              disabled={loading === 'viewer'}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'viewer' ? 'Loading...' : 'Try as Viewer'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 All data is pre-populated for demonstration purposes. No real security data is used.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Built with Next.js, TypeScript, Express, PostgreSQL, and Prisma
          </p>
          <div className="mt-4 flex justify-center gap-6 text-xs text-gray-600">
            <span>🔐 Admin: 19x@sentinelx.local</span>
            <span>🔐 Analyst: sarah.johnson@sentinelx.local</span>
            <span>🔐 Viewer: james.miller@sentinelx.local</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Password for Admin: <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Hacker@19</span>
            {' | '}
            Password for Analyst: <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Analyst123!</span>
            {' | '}
            Password for Viewer: <span className="font-mono bg-gray-800 px-2 py-0.5 rounded">Viewer123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}