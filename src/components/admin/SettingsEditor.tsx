import { useState } from 'react';

interface Props {
  site_name: string;
  contact_email: string;
  mailing_address: string;
  facebook_url: string;
}

export default function SettingsEditor(props: Props) {
  const [siteName, setSiteName] = useState(props.site_name);
  const [contactEmail, setContactEmail] = useState(props.contact_email);
  const [mailingAddress, setMailingAddress] = useState(props.mailing_address);
  const [facebookUrl, setFacebookUrl] = useState(props.facebook_url);

  const [saving, setSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSettingsMsg(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName,
          contact_email: contactEmail,
          mailing_address: mailingAddress,
          facebook_url: facebookUrl,
        }),
      });
      if (res.ok) {
        setSettingsMsg({ type: 'success', text: 'Settings saved successfully.' });
      } else {
        const data = await res.json().catch(() => ({}));
        setSettingsMsg({ type: 'error', text: data.error || 'Failed to save settings.' });
      }
    } catch {
      setSettingsMsg({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Failed to change password.' });
    } finally {
      setChangingPassword(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
    color: '#374151',
  };

  const msgStyle = (type: 'success' | 'error'): React.CSSProperties => ({
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
    background: type === 'success' ? '#dcfce7' : '#fee2e2',
    color: type === 'success' ? '#166534' : '#991b1b',
    border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`,
  });

  return (
    <div>
      {/* Site Settings */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: '"Zilla Slab", serif', marginTop: 0, marginBottom: 20, color: '#1e3a5f' }}>
          Site Settings
        </h2>

        {settingsMsg && <div style={msgStyle(settingsMsg.type)}>{settingsMsg.text}</div>}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Site Name</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            style={inputStyle}
            placeholder="LQP Lake Association"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            style={inputStyle}
            placeholder="info@example.com"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Mailing Address</label>
          <textarea
            value={mailingAddress}
            onChange={(e) => setMailingAddress(e.target.value)}
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            placeholder="PO Box 123, Lake City, MN 55041"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Facebook URL</label>
          <input
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://facebook.com/..."
          />
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          style={{
            background: saving ? '#9ca3af' : '#3D7A68',
            color: 'white',
            padding: '10px 24px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14,
            transition: 'background 0.2s',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Separator */}
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />

      {/* Change Password */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: '"Zilla Slab", serif', marginTop: 0, marginBottom: 20, color: '#1e3a5f' }}>
          Change Password
        </h2>

        {passwordMsg && <div style={msgStyle(passwordMsg.type)}>{passwordMsg.text}</div>}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={changingPassword}
          style={{
            background: changingPassword ? '#9ca3af' : '#1e3a5f',
            color: 'white',
            padding: '10px 24px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: changingPassword ? 'not-allowed' : 'pointer',
            fontSize: 14,
            transition: 'background 0.2s',
          }}
        >
          {changingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
