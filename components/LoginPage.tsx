import React, { useState } from 'react';
import { LogIn, Lock, User, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('researcher');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const HARDCODED_USERNAME = 'user001';
  const HARDCODED_PASSWORD = '123456789';

  const roles = [
    { id: 'researcher', label: 'Researcher', description: 'Conduct research and analysis' },
    { id: 'manager', label: 'Manager', description: 'Oversee projects and teams' },
    { id: 'analyst', label: 'Analyst', description: 'Review and analyze data' },
    { id: 'admin', label: 'Administrator', description: 'System administration' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
      onLogin(selectedRole);
    } else {
      setError('Invalid username or password. Use user001/123456789');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Biomed Nexus AI</h1>
            <p className="text-slate-300 text-sm">Research Intelligence Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-3">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedRole === role.id
                        ? 'border-teal-400 bg-teal-400/20 shadow-lg shadow-teal-400/30'
                        : 'border-slate-400/30 bg-slate-400/10 hover:border-slate-400/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{role.label}</div>
                      <div className="text-xs text-slate-400">{role.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-200 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-400/10 border border-slate-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:bg-slate-400/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-400/10 border border-slate-400/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:bg-slate-400/20 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-teal-500/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <p className="text-xs text-blue-300">
              <span className="font-semibold">Demo Credentials:</span><br/>
              Username: <code className="bg-slate-900/50 px-1 rounded">user001</code><br/>
              Password: <code className="bg-slate-900/50 px-1 rounded">123456789</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
