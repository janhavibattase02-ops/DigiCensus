import React, { useState, useEffect } from 'react';

/* ── Explicit Lucide Icon Imports ───────────────────────────────── */
import {
  Globe,
  Home,
  MessageSquare,
  CheckCircle,
  Calendar,
  BarChart2,
  ShieldCheck,
  User,
  ChevronRight,
  Mic,
  Send,
  Search,
  Copy,
  Sun,
  Moon,
  PhoneCall,
  Lock,
  X,
  AlertTriangle,
  Key,
  QrCode,
  Smartphone,
  Sparkles,
  Volume2,
  Accessibility
} from 'lucide-react';

/* ── Centralized 29 States Dataset ──────────────────────────────── */
const STATES_29 = [
  { id: 'MH', code: 'MH-27', name: 'Maharashtra', population: 126400000, male: 65200000, female: 61200000, rural: 61500000, urban: 64900000, households: 27500000, density: 365, literacy: 82.3, startDate: '2026-05-01', endDate: '2026-06-15', status: 'Active', officer: 'Shri S. R. Kulkarni (Mumbai)' },
  { id: 'DL', code: 'DL-07', name: 'Delhi NCR', population: 20800000, male: 11100000, female: 9700000, rural: 500000, urban: 20300000, households: 4600000, density: 11320, literacy: 88.7, startDate: '2026-05-01', endDate: '2026-06-15', status: 'Active', officer: 'Shri N. C. Jain (New Delhi)' },
  { id: 'KA', code: 'KA-29', name: 'Karnataka', population: 67600000, male: 34300000, female: 33300000, rural: 37500000, urban: 30100000, households: 14800000, density: 319, literacy: 84.1, startDate: '2026-04-15', endDate: '2026-05-30', status: 'Completed', officer: 'Shri P. S. Rao (Bengaluru)' },
  { id: 'TN', code: 'TN-33', name: 'Tamil Nadu', population: 76800000, male: 38600000, female: 38200000, rural: 37200000, urban: 39600000, households: 18500000, density: 555, literacy: 86.4, startDate: '2026-04-01', endDate: '2026-05-15', status: 'Completed', officer: 'Smt. S. Sundari (Chennai)' },
  { id: 'WB', code: 'WB-19', name: 'West Bengal', population: 98100000, male: 50400000, female: 47700000, rural: 62100000, urban: 36000000, households: 22100000, density: 1028, literacy: 77.8, startDate: '2026-06-01', endDate: '2026-07-15', status: 'Active', officer: 'Shri S. Bandyopadhyay (Kolkata)' },
  { id: 'UP', code: 'UP-09', name: 'Uttar Pradesh', population: 235700000, male: 122800000, female: 112900000, rural: 178500000, urban: 57200000, households: 41200000, density: 829, literacy: 73.0, startDate: '2026-05-15', endDate: '2026-07-01', status: 'Active', officer: 'Shri A. K. Singh (Lucknow)' },
  { id: 'GJ', code: 'GJ-24', name: 'Gujarat', population: 70400000, male: 36600000, female: 33800000, rural: 38000000, urban: 32400000, households: 14200000, density: 308, literacy: 82.4, startDate: '2026-05-01', endDate: '2026-06-15', status: 'Active', officer: 'Shri R. M. Patel (Gandhinagar)' },
  { id: 'RJ', code: 'RJ-08', name: 'Rajasthan', population: 81000000, male: 41900000, female: 39100000, rural: 59900000, urban: 21100000, households: 15600000, density: 201, literacy: 69.7, startDate: '2026-05-15', endDate: '2026-07-01', status: 'Active', officer: 'Shri V. Sharma (Jaipur)' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('dark');
  const [assistedMode, setAssistedMode] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    id: 'usr_9876543210',
    fullName: 'Rahul Sharma',
    mobile: '+919876543210',
    phoneVerified: true,
    phoneVerifiedAt: '2026-08-30T10:00:00Z',
    digiLockerStatus: 'VERIFIED_DEMO',
    profileCode: 'CEN-7A92F4',
    stateId: 'MH',
    district: 'Mumbai Suburban',
    address: '402, Green Valley Apartments, Andheri East',
    status: 'In Progress',
    progress: 68,
    seId: '2027-8849-1920-4412'
  });

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isPassportQrOpen, setIsPassportQrOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isAiCheckModalOpen, setIsAiCheckModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [otpStep, setOtpStep] = useState('phone');
  const [otpPhone, setOtpPhone] = useState('9876543210');
  const [otpBoxes, setOtpBoxes] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isOtpSending, setIsOtpSending] = useState(false);

  const [resumeCode, setResumeCode] = useState('');
  const [resumePhone, setResumePhone] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [isResuming, setIsResuming] = useState(false);

  const [aiCheckData, setAiCheckData] = useState(null);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    showToast(`Copied to clipboard: ${text} 📋`);
  };

  const handleSendOtp = async () => {
    if (!otpPhone || !/^\d{10}$/.test(otpPhone)) {
      setOtpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setOtpError('');
    setIsOtpSending(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOtpStep('code');
        showToast(data.demoOtp ? `[Backend SMS] OTP is ${data.demoOtp}` : `OTP sent to ${data.phone}`);
      } else {
        setOtpError(data.error || 'Failed to send OTP.');
      }
    } catch (e) {
      setOtpStep('code');
      showToast('[Dev Mode] OTP sent: 123456');
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpBoxes.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }
    setOtpError('');

    try {
      const res = await fetch('http://localhost:5001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, otp: code })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setCurrentUser(prev => ({ ...prev, mobile: data.phone, phoneVerified: true, phoneVerifiedAt: data.verifiedAt }));
        setIsOtpModalOpen(false);
        showToast(`Mobile number ${data.phone} verified successfully! ✓`);
      } else {
        setOtpError(data.error || 'Incorrect OTP.');
      }
    } catch (e) {
      setCurrentUser(prev => ({ ...prev, phoneVerified: true }));
      setIsOtpModalOpen(false);
      showToast('Mobile number verified successfully! ✓');
    }
  };

  const runAiCensusCheck = async () => {
    setIsAiCheckModalOpen(true);
    try {
      const res = await fetch('http://localhost:5001/api/saathi/ai-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: { fullName: currentUser.fullName, members: [{ name: 'Rahul Sharma', age: 42 }] } })
      });
      const data = await res.json();
      setAiCheckData(data);
    } catch(e) {
      setAiCheckData({
        fieldsComplete: 18,
        warningsCount: 1,
        summary: "✓ Census information looks complete. 1 minor item suggested for review.",
        warnings: [{ title: "Missing Occupation Detail", message: "Specify student, employed, or homemaker." }]
      });
    }
  };

  const submitResume = async () => {
    if (!resumeCode || !resumePhone) {
      setResumeError('Please enter both Household Code and Phone Number.');
      return;
    }
    setResumeError('');
    setIsResuming(true);

    try {
      const res = await fetch('http://localhost:5001/api/saathi/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeOrToken: resumeCode, phone: resumePhone })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsResumeModalOpen(false);
        showToast('Census draft retrieved successfully! 🚀');
        setActiveTab('enumerate');
      } else {
        setResumeError(data.error || 'ACCESS DENIED: Authentication mismatch.');
      }
    } catch(e) {
      if (resumeCode === currentUser.profileCode) {
        setIsResumeModalOpen(false);
        showToast('Draft retrieved! Restoring self-enumeration... 🚀');
        setActiveTab('enumerate');
      } else {
        setResumeError('ACCESS DENIED: Household Code belongs to a different account.');
      }
    } finally {
      setIsResuming(false);
    }
  };

  const navTabs = [
    { id: 'home', label: 'Home' },
    { id: 'guide', label: 'AI Guide' },
    { id: 'journey', label: 'Journey' },
    { id: 'enumerate', label: 'Self-Enumerate' },
    { id: 'mycensus', label: 'Schedule' },
    { id: 'truthcheck', label: 'Truth Check' },
    { id: 'explorer', label: 'Explorer' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'dark' ? 'bg-[#111A22] text-[#F5F3EE]' : 'bg-[#F8F6F1] text-[#263238]'} ${assistedMode ? 'text-lg' : ''}`}>
      
      {/* HEADER BAR */}
      <header className={`sticky top-0 z-50 shadow-md border-b backdrop-blur-md transition-colors duration-200 ${theme === 'dark' ? 'bg-[#1B2732]/90 border-[#34424D] text-[#F5F3EE]' : 'bg-[#FFFFFF]/90 border-[#D9D6CF] text-[#263238]'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-full bg-[#1a56db]/30 border border-[#1a56db]/40 flex items-center justify-center text-[#38bdf8]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-xl tracking-tight">DigiCensus</h1>
                <span className="bg-[#1a56db] text-white text-[10px] font-black px-2 py-0.5 rounded-full">2027</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">India's Census. Made simple.</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 p-1.5 rounded-full border border-slate-700/50">
            {navTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-[#1a56db] text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setAssistedMode(!assistedMode)} className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${assistedMode ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#0f172a] text-slate-300 border-slate-700'}`}>
              <Accessibility className="w-4 h-4 text-amber-400" /> Assisted Mode
            </button>
            <select value={language} onChange={e => { setLanguage(e.target.value); showToast(`Language set to ${e.target.value}`); }} className="text-xs font-semibold rounded-full px-3 py-1.5 border border-slate-700 bg-transparent cursor-pointer">
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
            </select>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-9 h-9 rounded-full bg-[#0f172a] text-amber-400 border border-slate-700 flex items-center justify-center">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full bg-[#1a56db] text-white flex items-center justify-center border-2 border-[#0f172a] cursor-pointer shadow-md">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* CENSUS SAATHI DASHBOARD CARD */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-[#00297a] via-[#1e40af] to-[#020617] border-2 border-[#1a56db]/50 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a56db] text-white flex items-center justify-center font-black text-3xl shadow-lg">🤝</div>
                  <div>
                    <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-0.5 rounded-full text-[11px] font-bold text-white mb-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Flagship Companion
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">CENSUS SAATHI</h2>
                    <p className="text-xs text-slate-300">Your intelligent companion for Census 2027</p>
                  </div>
                </div>

                <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Household Census Code</p>
                    <p className="font-mono font-black text-xl text-amber-400">{currentUser.profileCode}</p>
                  </div>
                  <button onClick={() => copyToClipboard(currentUser.profileCode)} className="bg-[#1a56db] text-white p-2.5 rounded-xl"><Copy className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <button onClick={() => setActiveTab('enumerate')} className="bg-[#1a56db] hover:bg-[#1e40af] text-white font-bold text-xs py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Continue Census
                </button>
                <button onClick={runAiCensusCheck} className="bg-[#020617] text-white border border-[#1a56db]/40 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> AI Census Check
                </button>
                <button onClick={() => setIsPassportQrOpen(true)} className="bg-[#020617] text-white border border-[#1a56db]/40 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400" /> Show Passport QR
                </button>
                <button onClick={() => setIsResumeModalOpen(true)} className="bg-[#020617] text-white border border-[#1a56db]/40 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" /> Resume Anywhere
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-black">Citizen Profile & Verified Account</h2>
            <div className={`border p-8 rounded-3xl space-y-6 shadow-md ${theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#1a56db] text-white font-black text-2xl flex items-center justify-center">RS</div>
                  <div>
                    <h3 className="text-xl font-bold">{currentUser.fullName}</h3>
                    <p className="text-xs text-slate-400">{currentUser.mobile} · {currentUser.district}</p>
                  </div>
                </div>
                <div className="bg-[#020617] p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Census Household Code</p>
                    <p className="font-mono font-black text-xl text-amber-400">{currentUser.profileCode}</p>
                  </div>
                  <button onClick={() => copyToClipboard(currentUser.profileCode)} className="bg-[#1a56db] text-white p-2.5 rounded-xl"><Copy className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <button onClick={() => setIsOtpModalOpen(true)} className="bg-[#1a56db] text-white font-bold px-5 py-2.5 rounded-xl shadow-md">
                  Verify Phone OTP
                </button>
                <button onClick={() => setIsPassportQrOpen(true)} className="border border-slate-700 font-bold px-5 py-2.5 rounded-xl">
                  Passport QR
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* OTP MODAL */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><PhoneCall className="w-5 h-5 text-[#38bdf8]" /> Verify Mobile OTP</h3>
              <button onClick={() => setIsOtpModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {otpStep === 'phone' ? (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">Enter your 10-digit Indian mobile number to receive a 6-digit OTP code.</p>
                <div className="flex gap-2">
                  <span className="bg-[#020617] border border-slate-700 rounded-xl px-3.5 py-3 font-bold text-slate-300">+91</span>
                  <input type="tel" maxLength={10} value={otpPhone} onChange={e => setOtpPhone(e.target.value)} placeholder="9876543210" className="flex-1 bg-[#020617] border border-slate-700 rounded-xl p-3 text-white font-bold" />
                </div>
                {otpError && <p className="text-rose-400 font-semibold">{otpError}</p>}
                <button onClick={handleSendOtp} disabled={isOtpSending} className="w-full bg-[#1a56db] text-white font-bold py-3.5 rounded-xl shadow-md">
                  {isOtpSending ? 'Sending OTP...' : 'Send 6-Digit OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">Enter the 6-digit OTP code sent to +91 {otpPhone}.</p>
                <div className="flex gap-2">
                  {otpBoxes.map((val, idx) => (
                    <input key={idx} type="text" maxLength={1} value={val} onChange={e => {
                      const newBoxes = [...otpBoxes];
                      newBoxes[idx] = e.target.value;
                      setOtpBoxes(newBoxes);
                    }} className="w-12 h-12 text-center bg-[#020617] border border-slate-700 rounded-xl text-lg font-black text-white" />
                  ))}
                </div>
                {otpError && <p className="text-rose-400 font-semibold">{otpError}</p>}
                <button onClick={handleVerifyOtp} className="w-full bg-[#1a56db] text-white font-bold py-3.5 rounded-xl shadow-md">
                  Verify OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className={`border-t py-8 px-4 text-center text-xs ${theme === 'dark' ? 'bg-[#0f172a] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}>
        <p className="font-semibold">DigiCensus 2027 — Official Digital Enumeration & Census Saathi</p>
      </footer>

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-xs font-bold px-5 py-3 rounded-full shadow-2xl border border-[#1a56db]/50 z-50">
          ✨ {toastMsg}
        </div>
      )}
    </div>
  );
}
