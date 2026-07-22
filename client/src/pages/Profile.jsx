import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { 
  User, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Lock, 
  HelpCircle,
  Loader2
} from 'lucide-react';

export const Profile = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const { register: profileRegister, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      currency: user?.currency || 'INR',
      language: user?.language || 'en',
      theme: user?.theme || 'dark',
      financialProfile: {
        monthlyIncome: user?.financialProfile?.monthlyIncome || 0,
        hasEmergencyFund: user?.financialProfile?.hasEmergencyFund || false,
        emergencyFundMonths: user?.financialProfile?.emergencyFundMonths || 0,
        hasDebt: user?.financialProfile?.hasDebt || false,
        debtAmount: user?.financialProfile?.debtAmount || 0,
      }
    }
  });

  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm } = useForm();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarLoading(true);
    const res = await uploadAvatar(file);
    setAvatarLoading(false);

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Avatar image updated successfully.' });
    } else {
      setProfileMsg({ type: 'error', text: res.message });
    }
  };

  const onUpdateProfile = async (formData) => {
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    // Format fields correctly
    formData.financialProfile.monthlyIncome = parseFloat(formData.financialProfile.monthlyIncome) || 0;
    formData.financialProfile.emergencyFundMonths = parseInt(formData.financialProfile.emergencyFundMonths) || 0;
    formData.financialProfile.debtAmount = parseFloat(formData.financialProfile.debtAmount) || 0;

    const res = await updateProfile(formData);
    setProfileLoading(false);

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Financial profile and configurations saved.' });
    } else {
      setProfileMsg({ type: 'error', text: res.message });
    }
  };

  const onChangePassword = async (formData) => {
    setPasswordLoading(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
        resetPasswordForm();
      }
    } catch (err) {
      setPasswordMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update password.' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
          Profile Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure your default settings and telemetry variables</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar and Password Change */}
        <div className="space-y-6">
          
          {/* Avatar Upload Card */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder text-center space-y-4">
            <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Avatar Photo</h2>
            
            <div className="relative w-28 h-28 mx-auto group">
              {user?.avatar?.url ? (
                <img 
                  src={user.avatar.url} 
                  alt={user.name} 
                  className="w-full h-full rounded-full object-cover border-2 border-indigo-500/20" 
                />
              ) : (
                <div className="w-full h-full rounded-full bg-indigo-500/5 border-2 border-indigo-500/10 flex items-center justify-center text-indigo-300 text-3xl font-extrabold font-heading">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-indigo-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            <div>
              <label className="px-4 py-2 rounded-lg bg-slate-900 border border-glassBorder hover:bg-slate-800/40 text-xs font-semibold text-slate-350 cursor-pointer transition-all inline-flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Change Photo
                <input type="file" onChange={handleAvatarUpload} className="hidden" accept="image/*" />
              </label>
            </div>
          </div>

          {/* Password Change Card */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder space-y-4">
            <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-400" /> Security settings
            </h2>

            {passwordMsg.text && (
              <div className={`p-2.5 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 ${
                passwordMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {passwordMsg.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...passwordRegister('currentPassword')}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">New Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...passwordRegister('newPassword')}
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2 px-4 rounded-lg btn-primary text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Preferences & Financial Profile Form */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-glassBorder">
          <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-5">Financial Profile configuration</h2>

          {profileMsg.text && (
            <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 mb-4 ${
              profileMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-6">
            
            {/* Preferences Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-300">Basic Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...profileRegister('name')}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Telephone No</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...profileRegister('phone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Primary Currency</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-semibold"
                    {...profileRegister('currency')}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">AI Advisor Language</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-semibold"
                    {...profileRegister('language')}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial variables section */}
            <div className="space-y-4 pt-4 border-t border-glassBorder/40">
              <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                Financial Score Metrics <HelpCircle className="w-4 h-4 text-slate-500" />
              </h3>

              <div>
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Estimated Monthly Income (₹)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...profileRegister('financialProfile.monthlyIncome')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/20 p-4 rounded-xl border border-glassBorder/60">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasEmergencyFund"
                      className="w-4 h-4 rounded border-glassBorder bg-[#0a0f1a] text-indigo-500 accent-indigo-500"
                      {...profileRegister('financialProfile.hasEmergencyFund')}
                    />
                    <label htmlFor="hasEmergencyFund" className="text-xs font-semibold text-slate-200">Emergency fund built?</label>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Emergency fund coverage (months)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 text-xs glass-input font-medium"
                      {...profileRegister('financialProfile.emergencyFundMonths')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasDebt"
                      className="w-4 h-4 rounded border-glassBorder bg-[#0a0f1a] text-indigo-500 accent-indigo-500"
                      {...profileRegister('financialProfile.hasDebt')}
                    />
                    <label htmlFor="hasDebt" className="text-xs font-semibold text-slate-200">Active Debt / Loans?</label>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wide mb-1.5">Outstanding Debt Amount (₹)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 text-xs glass-input font-medium"
                      {...profileRegister('financialProfile.debtAmount')}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full py-2.5 px-4 rounded-lg btn-primary text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {profileLoading ? 'Saving changes...' : 'Save Settings'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
export default Profile;
