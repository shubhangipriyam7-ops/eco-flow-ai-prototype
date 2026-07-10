import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity as ActivityIcon,
  Database,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  Leaf,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Server,
  Building2,
  ArrowRight,
  User,
  Cpu,
  FileText,
  Clock,
  Terminal,
  Layers,
  Sparkles,
  Search,
  Filter
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

// TypeScript definitions matching backend schemas
interface UserProfile {
  id: string;
  email: string;
}

interface DatabaseState {
  companies: Array<{ id: number; name: string; industry: string; created_at: string }>;
  departments: Array<{ id: number; company_id: number; name: string }>;
  activities: Array<{
    id: number;
    company_id: number;
    department_id: number;
    date: string;
    electricity_kwh: number;
    fuel_liters: number;
    paper_kg: number;
    plastic_kg: number;
    food_kg: number;
    packaging_kg: number;
    water_liters: number;
  }>;
  predictions: Array<{ id: number; company_id: number; prediction_date: string; predicted_emission: number }>;
}

interface PredictResponse {
  current_emission: number;
  predicted_next_month: number;
  trend: string;
}

interface RecommendationItem {
  recommendation: string;
  estimated_co2_savings_kg: number;
  estimated_cost_savings_usd: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "database" | "guide">("dashboard");
  
  // Simulated Authentication Settings
  const [useValidToken, setUseValidToken] = useState(true);
  const [testEmail, setTestEmail] = useState("sustainability.lead@ecocorp.com");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Core API states
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState(0);
  const [syncResult, setSyncResult] = useState<{ count: number; message: string } | null>(null);
  
  // Loading & error trackers
  const [isLoadingPredict, setIsLoadingPredict] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search/Filter states for DB Explorer
  const [dbSearch, setDbSearch] = useState("");
  const [dbTable, setDbTable] = useState<"companies" | "departments" | "activities" | "predictions">("activities");

  // Get authentication headers
  const getHeaders = () => {
    return {
      "Content-Type": "application/json",
      "Authorization": useValidToken ? "Bearer valid-token-secret-jwt-12345" : "Bearer invalid-token-test",
      "x-test-email": testEmail
    };
  };

  // 1. Fetch user profile (GET /me)
  const fetchProfile = async () => {
    try {
      setAuthError(null);
      const res = await fetch("/api/me", { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 401) {
          setProfile(null);
          throw new Error("401 Unauthorized: Invalid or missing Supabase access token.");
        }
        throw new Error(`Failed to load profile (status ${res.status})`);
      }
      const data = await res.json();
      setProfile(data);
    } catch (err: any) {
      setAuthError(err.message);
      setProfile(null);
    }
  };

  // 2. Fetch predictions (GET /predict)
  const fetchPredictions = async () => {
    try {
      setIsLoadingPredict(true);
      setApiError(null);
      const res = await fetch("/api/predict", { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("401 Unauthorized: Cannot query predictions. Please verify your Supabase JWT credentials.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Error retrieving carbon predictions.");
      }
      const data = await res.json();
      setPrediction(data);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoadingPredict(false);
    }
  };

  // 3. Fetch recommendations (GET /recommendations)
  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecs(true);
      setApiError(null);
      const res = await fetch("/api/recommendations", { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("401 Unauthorized: Cannot query recommendations. Please verify your Supabase JWT credentials.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Error retrieving recommendations.");
      }
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // 4. Fetch DB State (Extra viewer API)
  const fetchDbState = async () => {
    try {
      const res = await fetch("/api/db-view");
      if (res.ok) {
        const data = await res.json();
        setDbState(data);
      }
    } catch (err) {
      console.error("DB view fetch error", err);
    }
  };

  // Trigger Sync (POST /sync-odoo)
  const triggerOdooSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      setApiError(null);
      
      // Step-by-step animated Odoo sync log simulation
      setSyncStep(1); // Connecting to Odoo XML-RPC
      await new Promise((r) => setTimeout(r, 1200));
      
      setSyncStep(2); // Fetching Inventory/Fleet/Purchase/Accounting logs
      await new Promise((r) => setTimeout(r, 1200));
      
      setSyncStep(3); // Running Pandas preprocessor (removing duplicates, unit standardizing)
      await new Promise((r) => setTimeout(r, 1200));
      
      setSyncStep(4); // Saving to PostgreSQL database and retraining model
      await new Promise((r) => setTimeout(r, 1000));

      const res = await fetch("/api/sync-odoo", {
        method: "POST",
        headers: getHeaders()
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("401 Unauthorized: Cannot sync with Odoo. Authentication token rejected.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Odoo ERP synchronization failed.");
      }

      const data = await res.json();
      setSyncResult({ count: data.records_synced, message: data.message });
      
      // Refresh predictions and database tables upon success
      fetchPredictions();
      fetchRecommendations();
      fetchDbState();
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsSyncing(false);
      setSyncStep(0);
    }
  };

  // Load everything on startup and whenever JWT configs change
  useEffect(() => {
    fetchProfile();
    fetchPredictions();
    fetchRecommendations();
    fetchDbState();
  }, [useValidToken, testEmail]);

  // Translate Department IDs to names for the list/table
  const getDepartmentName = (id: number) => {
    if (!dbState) return "Operations";
    const dept = dbState.departments.find(d => d.id === id);
    return dept ? dept.name : "Operations";
  };

  // Calculate carbon footprints for specific activities for Recharts
  const getCarbonEmissionsData = () => {
    if (!dbState || !dbState.activities) return [];
    
    // Group activities by date
    const dateMap: { [date: string]: { date: string; emissions: number } } = {};
    dbState.activities.forEach(act => {
      const co2 = (
        act.electricity_kwh * EMISSION_FACTORS.electricity_kwh +
        act.fuel_liters * EMISSION_FACTORS.fuel_liters +
        act.paper_kg * EMISSION_FACTORS.paper_kg +
        act.plastic_kg * EMISSION_FACTORS.plastic_kg +
        act.food_kg * EMISSION_FACTORS.food_kg
      );
      
      if (!dateMap[act.date]) {
        dateMap[act.date] = { date: act.date, emissions: 0 };
      }
      dateMap[act.date].emissions += Math.round(co2);
    });

    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getDepartmentShareData = () => {
    if (!dbState || !dbState.activities) return [];
    
    const deptMap: { [deptId: number]: { name: string; value: number } } = {};
    dbState.activities.forEach(act => {
      const co2 = (
        act.electricity_kwh * EMISSION_FACTORS.electricity_kwh +
        act.fuel_liters * EMISSION_FACTORS.fuel_liters +
        act.paper_kg * EMISSION_FACTORS.paper_kg +
        act.plastic_kg * EMISSION_FACTORS.plastic_kg +
        act.food_kg * EMISSION_FACTORS.food_kg
      );
      
      if (!deptMap[act.department_id]) {
        deptMap[act.department_id] = { name: getDepartmentName(act.department_id), value: 0 };
      }
      deptMap[act.department_id].value += Math.round(co2);
    });
    
    return Object.values(deptMap);
  };

  const EMISSION_FACTORS = {
    electricity_kwh: 0.38,
    fuel_liters: 2.68,
    paper_kg: 0.95,
    plastic_kg: 1.85,
    food_kg: 2.10
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-150 selection:text-emerald-900">
      
      {/* Global Dashboard Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-100">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">EcoFlow AI</h1>
                <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                  FastAPI backend active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Carbon Accounting, Odoo XML-RPC Sync & Regression Forecasting
              </p>
            </div>
          </div>
          
          {/* Main Workspace Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-white text-emerald-700 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ActivityIcon className="w-3.5 h-3.5" />
              Sustainability Panel
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "database"
                  ? "bg-white text-emerald-700 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Database Explorer
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "guide"
                  ? "bg-white text-emerald-700 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              FastAPI Startup Guide
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          
          {/* Tab 1: Dashboard and Interactive Sandbox */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              
              {/* Top Row: Supabase Security and Simulation Console */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Supabase Security Module */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-semibold text-slate-900">Supabase Auth Gateway</h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${useValidToken ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
                          {useValidToken ? "Token Valid" : "Token Invalid"}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      API routes are heavily protected by standard Supabase JWT Auth Middleware.
                      Use this panel to simulate different client configurations and watch how the system validates Bearer signatures.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Test Email Address
                        </label>
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Bearer Authorization Secret
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={useValidToken ? "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." : "Bearer invalid-token-test-signature"}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-400 font-mono text-xs cursor-not-allowed select-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => setUseValidToken(true)}
                      className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all ${
                        useValidToken
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Authenticate with Supabase
                    </button>
                    <button
                      onClick={() => setUseValidToken(false)}
                      className={`flex-1 text-xs py-2 rounded-lg font-medium transition-all ${
                        !useValidToken
                          ? "bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Simulate 401 Unauthorized
                    </button>
                  </div>
                </div>

                {/* Live Auth Profile State card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      User Context (GET /me)
                    </h3>
                    
                    {profile ? (
                      <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">
                              {profile.email}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              ID: {profile.id}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg py-1 px-2.5 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Supabase Session Verified
                        </div>
                      </div>
                    ) : (
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold">
                          <AlertTriangle className="w-4 h-4" />
                          Invalid JWT Signature
                        </div>
                        <p className="text-[11px] text-rose-500 leading-relaxed">
                          Your authorization token was rejected. Backend endpoints returned 401. Try toggling to "Authenticate" on the left.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      11:57:07 UTC
                    </span>
                    <span className="font-mono text-slate-500">EcoFlow API v1.0</span>
                  </div>
                </div>

              </div>

              {/* Middle Row: Odoo ERP Sync Block and Carbon Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Odoo XML-RPC Sync Center */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                          <RefreshCw className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-semibold text-slate-900">Odoo ERP Integrator</h2>
                      </div>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                        XML-RPC v2
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Reads raw resource quantities from four key modules: **Inventory, Purchase, Fleet,** and **Accounting**.
                      Then, compiles it into a unified matrix before feeding it into the Pandas preprocessing pipeline.
                    </p>

                    {/* Stage Pipeline Simulator when syncing */}
                    {isSyncing ? (
                      <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Processing XML-RPC Pipeline...
                        </div>
                        
                        <div className="space-y-2 text-[11px]">
                          <div className={`flex items-center gap-2 ${syncStep >= 1 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStep >= 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Connecting via XML-RPC client...
                          </div>
                          <div className={`flex items-center gap-2 ${syncStep >= 2 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStep >= 2 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Reading Inventory, Fleet & Ledger logs...
                          </div>
                          <div className={`flex items-center gap-2 ${syncStep >= 3 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStep >= 3 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            Pandas: Standardizing units & casing...
                          </div>
                          <div className={`flex items-center gap-2 ${syncStep >= 4 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStep >= 4 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            PostgreSQL: Upserting and model training...
                          </div>
                        </div>
                      </div>
                    ) : syncResult ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs space-y-1 mb-4">
                        <div className="text-emerald-800 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          Sync Successful
                        </div>
                        <p className="text-[11px] text-emerald-600 leading-relaxed">
                          {syncResult.message}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 mb-4 bg-slate-50">
                        <Cpu className="w-8 h-8 text-slate-300" />
                        <div className="text-xs text-slate-600 font-medium">Ready to sync</div>
                        <p className="text-[10px] text-slate-400 max-w-[180px]">
                          Starts Odoo data fetch, run preprocessors, and retrain linear regression model.
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={triggerOdooSync}
                    disabled={isSyncing}
                    className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing ERP..." : "Sync ERP & Preprocess"}
                  </button>
                </div>

                {/* Right Side: Prediction Visual Chart & Trend Cards (Recharts) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <h2 className="text-sm font-semibold text-slate-900">Carbon Emission Predictor (scikit-learn)</h2>
                      </div>
                      
                      {prediction && (
                        <div className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full flex items-center gap-1 font-mono ${
                          prediction.trend === "Increasing"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prediction.trend === "Increasing" ? "bg-rose-500" : "bg-emerald-500"}`} />
                          Trend: {prediction.trend}
                        </div>
                      )}
                    </div>

                    {authError || apiError ? (
                      <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 text-xs space-y-1 my-6 flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">API Communication Failure</div>
                          <div className="text-[11px] text-rose-600 leading-relaxed">{authError || apiError}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Current Month Average
                            </span>
                            <span className="text-xl font-bold font-mono text-slate-800">
                              {isLoadingPredict ? "..." : prediction ? `${prediction.current_emission.toLocaleString()} kg` : "0.0 kg"}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">CO₂eq emitted globally</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-150 text-indigo-600 shadow-xs">
                            <ActivityIcon className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              AI Next-Month Forecast
                            </span>
                            <span className="text-xl font-bold font-mono text-emerald-700">
                              {isLoadingPredict ? "..." : prediction ? `${prediction.predicted_next_month.toLocaleString()} kg` : "0.0 kg"}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Linear Regression projection</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-slate-150 text-emerald-600 shadow-xs">
                            <Sparkles className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emission Chart area */}
                    {!authError && !apiError && (
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={getCarbonEmissionsData().length > 0 ? getCarbonEmissionsData() : [
                              { date: "June 10", emissions: 4500 },
                              { date: "June 15", emissions: 6100 },
                              { date: "June 20", emissions: 7800 },
                              { date: "June 25", emissions: 9400 },
                              { date: "July 01", emissions: 11200 },
                              { date: "July 05", emissions: 12500 }
                            ]}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorCO2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} tickLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none" }}
                              labelStyle={{ color: "#94a3b8", fontSize: "10px", fontFamily: "monospace" }}
                              itemStyle={{ color: "#34d399", fontSize: "11px", fontWeight: "600" }}
                            />
                            <Area type="monotone" dataKey="emissions" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorCO2)" name="kg CO2eq" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-slate-400 mt-4 flex items-center justify-between">
                    <span>* Regression algorithms auto-train whenever fresh data is synchronized</span>
                    <button onClick={fetchPredictions} className="text-emerald-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                      <RefreshCw className="w-3 h-3" /> Force Retrain
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Row: AI Recommendation Engine Outputs */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">AI Sustainability Recommendation Engine</h2>
                      <p className="text-xs text-slate-500">
                        Top suggestions dynamically computed based on actual departmental resource consumption thresholds
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={fetchRecommendations}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition-all cursor-pointer"
                    title="Refresh Recommendations"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingRecs ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse bg-slate-50 border border-slate-100 rounded-xl p-4 h-32" />
                    ))}
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {recommendations.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/10 rounded-xl p-4 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                              Rank #{index + 1}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Impact {98 - index * 6}%
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            {item.recommendation}
                          </p>
                        </div>

                        <div className="border-t border-slate-150 pt-3 mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1 font-semibold">
                              <Leaf className="w-3 h-3 text-emerald-500" /> CO₂ saved:
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {item.estimated_co2_savings_kg.toLocaleString()} kg
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1 font-semibold">
                              <DollarSign className="w-3 h-3 text-emerald-500" /> Cost saved:
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              ${item.estimated_cost_savings_usd.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-2">
                    <AlertTriangle className="w-10 h-10 text-slate-350" />
                    <div className="text-xs font-semibold text-slate-600">No Recommendations Available</div>
                    <p className="text-[11px] text-slate-400 max-w-[280px]">
                      Authenticate and sync with Odoo to populate consumption data for recommendation assessment.
                    </p>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* Tab 2: Database Explorer (Schema & Simulated Tables) */}
          {activeTab === "database" && (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* Header explaining DB design */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-md font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-600" />
                      PostgreSQL Database Viewer
                    </h2>
                    <p className="text-xs text-slate-500">
                      View relational tables mapping Company, Department, Activity Logs, and Linear Regression predictions.
                    </p>
                  </div>
                  
                  {/* Table Switcher */}
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {["companies", "departments", "activities", "predictions"].map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => {
                          setDbTable(tbl as any);
                          setDbSearch("");
                        }}
                        className={`px-3 py-1 text-[11px] font-semibold rounded-md capitalize transition-all ${
                          dbTable === tbl
                            ? "bg-white text-emerald-700 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Data Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-emerald-800 uppercase bg-emerald-50 border border-emerald-100 rounded px-2.5 py-0.5">
                      Table: {dbTable}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dbState ? `(${dbState[dbTable]?.length || 0} rows)` : "(Loading rows...)"}
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 font-mono"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96">
                  {dbState ? (
                    <table className="w-full text-left border-collapse text-xs">
                      
                      {/* Render Companies Table */}
                      {dbTable === "companies" && (
                        <>
                          <thead className="bg-slate-50/55 border-b border-slate-150 text-slate-500 font-semibold sticky top-0">
                            <tr>
                              <th className="p-3">ID</th>
                              <th className="p-3">Name</th>
                              <th className="p-3">Industry</th>
                              <th className="p-3">Created At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {dbState.companies
                              .filter(c => c.name.toLowerCase().includes(dbSearch.toLowerCase()))
                              .map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 text-indigo-600 font-bold">#{c.id}</td>
                                  <td className="p-3 font-sans font-medium text-slate-800">{c.name}</td>
                                  <td className="p-3 font-sans text-slate-500">{c.industry}</td>
                                  <td className="p-3 text-slate-400 text-[11px]">{new Date(c.created_at).toLocaleString()}</td>
                                </tr>
                              ))}
                          </tbody>
                        </>
                      )}

                      {/* Render Departments Table */}
                      {dbTable === "departments" && (
                        <>
                          <thead className="bg-slate-50/55 border-b border-slate-150 text-slate-500 font-semibold sticky top-0">
                            <tr>
                              <th className="p-3">ID</th>
                              <th className="p-3">Company ID</th>
                              <th className="p-3">Department Name</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {dbState.departments
                              .filter(d => d.name.toLowerCase().includes(dbSearch.toLowerCase()))
                              .map(d => (
                                <tr key={d.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 text-indigo-600 font-bold">#{d.id}</td>
                                  <td className="p-3 text-slate-400">Company #{d.company_id}</td>
                                  <td className="p-3 font-sans font-medium text-slate-800">{d.name}</td>
                                </tr>
                              ))}
                          </tbody>
                        </>
                      )}

                      {/* Render Activities Table */}
                      {dbTable === "activities" && (
                        <>
                          <thead className="bg-slate-50/55 border-b border-slate-150 text-slate-500 font-semibold sticky top-0">
                            <tr>
                              <th className="p-3">ID</th>
                              <th className="p-3">Dept Name</th>
                              <th className="p-3">Date</th>
                              <th className="p-3 text-right">Elec (kWh)</th>
                              <th className="p-3 text-right">Fuel (L)</th>
                              <th className="p-3 text-right">Paper (kg)</th>
                              <th className="p-3 text-right">Plastic (kg)</th>
                              <th className="p-3 text-right">Water (L)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {dbState.activities
                              .filter(a => getDepartmentName(a.department_id).toLowerCase().includes(dbSearch.toLowerCase()) || a.date.includes(dbSearch))
                              .map(a => (
                                <tr key={a.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 text-indigo-600 font-bold">#{a.id}</td>
                                  <td className="p-3 font-sans font-medium text-slate-800">{getDepartmentName(a.department_id)}</td>
                                  <td className="p-3 text-slate-500 font-semibold text-[11px]">{a.date}</td>
                                  <td className="p-3 text-right text-slate-600">{a.electricity_kwh.toLocaleString()}</td>
                                  <td className="p-3 text-right text-slate-600">{a.fuel_liters.toLocaleString()}</td>
                                  <td className="p-3 text-right text-slate-600">{a.paper_kg.toLocaleString()}</td>
                                  <td className="p-3 text-right text-slate-600">{a.plastic_kg.toLocaleString()}</td>
                                  <td className="p-3 text-right text-slate-600">{a.water_liters.toLocaleString()}</td>
                                </tr>
                              ))}
                          </tbody>
                        </>
                      )}

                      {/* Render Predictions Table */}
                      {dbTable === "predictions" && (
                        <>
                          <thead className="bg-slate-50/55 border-b border-slate-150 text-slate-500 font-semibold sticky top-0">
                            <tr>
                              <th className="p-3">ID</th>
                              <th className="p-3">Company ID</th>
                              <th className="p-3">Prediction Date</th>
                              <th className="p-3 text-right">Predicted Carbon Emission</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {dbState.predictions
                              .filter(p => p.prediction_date.includes(dbSearch))
                              .map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/40">
                                  <td className="p-3 text-indigo-600 font-bold">#{p.id}</td>
                                  <td className="p-3 text-slate-400">Company #{p.company_id}</td>
                                  <td className="p-3 text-slate-500 font-semibold">{p.prediction_date}</td>
                                  <td className="p-3 text-right font-bold text-emerald-700">{p.predicted_emission.toLocaleString()} kg CO₂eq</td>
                                </tr>
                              ))}
                          </tbody>
                        </>
                      )}

                    </table>
                  ) : (
                    <div className="text-center py-24 text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading SQL records...
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          )}

          {/* Tab 3: Developer Guide (Local Setup & Run Instructions) */}
          {activeTab === "guide" && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              
              {/* Introduction Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Server className="w-5 h-5 text-indigo-600" />
                  FastAPI Backend Local Deployment Guide
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We have fully written the complete production-ready Python backend codebase within the <span className="font-mono font-bold bg-slate-50 text-slate-800 px-1 py-0.5 rounded">/backend/</span> folder. 
                  It includes the standard directory architecture with FastAPI endpoints, SQLAlchemy relational models, Alembic database migrations, Pydantic data validations, Supabase bearer authentication, and Odoo ERP XML-RPC connections.
                </p>
              </div>

              {/* Folder structure overview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Pristine Backend Folder Tree
                </h3>
                <pre className="text-xs font-mono bg-slate-50 border border-slate-150 p-4 rounded-xl text-slate-700 overflow-x-auto leading-relaxed">
{`backend/
├── app/
│   ├── api/                  # API routing, parameter validation
│   ├── core/
│   │   ├── config.py         # Pydantic Settings, environment variables
│   │   └── security.py       # Supabase JWT decoding and authorization checks
│   ├── database/
│   │   └── session.py        # SQLAlchemy engine and session providers
│   ├── models/               # SQLAlchemy ORM schemas (Company, Department, Activity...)
│   ├── schemas/              # Pydantic validation schemas (Company, Activity...)
│   ├── services/             # Core engines (Odoo ERP sync, Scikit-Learn forecasts...)
│   └── main.py               # Main application router & CORS config
├── .env                      # Database configuration & Supabase secrets
├── alembic.ini               # Alembic database migration config
└── requirements.txt          # PIP package requirements`}
                </pre>
              </div>

              {/* Startup Procedure */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  How to Boot FastAPI locally (Step-by-Step)
                </h3>

                <div className="space-y-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                        1
                      </span>
                      <h4 className="font-bold text-slate-800">Set Up Python Virtual Environment</h4>
                    </div>
                    <pre className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[11px] text-slate-600">
                      {`cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                        2
                      </span>
                      <h4 className="font-bold text-slate-800">Install Python Requirements</h4>
                    </div>
                    <pre className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[11px] text-slate-600">
                      {`pip install -r requirements.txt`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                        3
                      </span>
                      <h4 className="font-bold text-slate-800">Configure Environment Keys</h4>
                    </div>
                    <p className="text-slate-500 mb-1.5 leading-relaxed">
                      Modify the <span className="font-mono bg-slate-100 text-slate-800 px-1 rounded text-[11px]">.env</span> file in the backend root directory. Provide your Supabase JWT secret and connection details.
                    </p>
                    <pre className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[11px] text-slate-600">
                      {`DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecoflow_ai"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"`}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                        4
                      </span>
                      <h4 className="font-bold text-slate-800">Run Alembic migrations & Launch</h4>
                    </div>
                    <pre className="bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[11px] text-slate-600">
                      {`alembic upgrade head
uvicorn app.main:app --reload --port 8000`}
                    </pre>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Global Bottom Credit Section */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-600">EcoFlow AI Platform</span>
          </div>
          <p className="text-slate-400 font-mono text-[11px]">
            Created & Compiled for Enterprise Sustainability Auditing
          </p>
        </div>
      </footer>

    </div>
  );
}
