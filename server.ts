import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database to simulate PostgreSQL tables (Company, Department, Activity, Prediction)
interface Company {
  id: number;
  name: string;
  industry: string;
  created_at: string;
}

interface Department {
  id: number;
  company_id: number;
  name: string;
}

interface Activity {
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
}

interface Prediction {
  id: number;
  company_id: number;
  prediction_date: string;
  predicted_emission: number;
}

// Seed Initial Data
const companies: Company[] = [
  { id: 1, name: "EcoCorp Global", industry: "Manufacturing & Distribution", created_at: "2026-01-15T08:00:00Z" }
];

const departments: Department[] = [
  { id: 1, company_id: 1, name: "Operations" },
  { id: 2, company_id: 1, name: "Logistics" },
  { id: 3, company_id: 1, name: "Administration" },
  { id: 4, company_id: 1, name: "Procurement" }
];

let activities: Activity[] = [
  { id: 1, company_id: 1, department_id: 1, date: "2026-06-10", electricity_kwh: 4500, fuel_liters: 1200, paper_kg: 220, plastic_kg: 340, food_kg: 180, packaging_kg: 500, water_liters: 12000 },
  { id: 2, company_id: 1, department_id: 2, date: "2026-06-12", electricity_kwh: 1200, fuel_liters: 4800, paper_kg: 50, plastic_kg: 120, food_kg: 40, packaging_kg: 850, water_liters: 4500 },
  { id: 3, company_id: 1, department_id: 3, date: "2026-06-15", electricity_kwh: 3100, fuel_liters: 150, paper_kg: 480, plastic_kg: 80, food_kg: 110, packaging_kg: 90, water_liters: 3200 },
  { id: 4, company_id: 1, department_id: 4, date: "2026-06-18", electricity_kwh: 800, fuel_liters: 350, paper_kg: 600, plastic_kg: 400, food_kg: 50, packaging_kg: 1200, water_liters: 1500 },
  { id: 5, company_id: 1, department_id: 1, date: "2026-06-20", electricity_kwh: 4200, fuel_liters: 1100, paper_kg: 210, plastic_kg: 310, food_kg: 170, packaging_kg: 480, water_liters: 11500 },
  { id: 6, company_id: 1, department_id: 2, date: "2026-06-22", electricity_kwh: 1100, fuel_liters: 4600, paper_kg: 45, plastic_kg: 115, food_kg: 35, packaging_kg: 810, water_liters: 4200 },
  { id: 7, company_id: 1, department_id: 3, date: "2026-06-25", electricity_kwh: 2900, fuel_liters: 140, paper_kg: 420, plastic_kg: 75, food_kg: 105, packaging_kg: 80, water_liters: 3000 },
  { id: 8, company_id: 1, department_id: 4, date: "2026-06-28", electricity_kwh: 750, fuel_liters: 320, paper_kg: 550, plastic_kg: 380, food_kg: 45, packaging_kg: 1100, water_liters: 1400 }
];

let predictions: Prediction[] = [
  { id: 1, company_id: 1, prediction_date: "2026-07-10", predicted_emission: 18450.5 }
];

// Emission Factors (Matching Python setup)
const EMISSION_FACTORS = {
  electricity_kwh: 0.38,
  fuel_liters: 2.68,
  paper_kg: 0.95,
  plastic_kg: 1.85,
  food_kg: 2.10
};

// Clean and Preprocess Logic (Mimicking Pandas preprocessor)
function cleanAndNormalizeData(rawData: any[]): Activity[] {
  const cleaned: Activity[] = [];
  const keysSeen = new Set<string>();

  rawData.forEach((item, index) => {
    // 1. Remove Duplicates
    const dateStr = item.date || new Date().toISOString().split("T")[0];
    const deptName = (item.department || "Operations").trim();
    const key = `${dateStr}_${deptName}`;

    if (keysSeen.has(key)) {
      return; // Skip duplicate records
    }
    keysSeen.add(key);

    // 2. Normalize Department names (resolving aliases like Pandas)
    let finalDeptName = deptName;
    if (finalDeptName === "Sales Fleet" || finalDeptName === "Logistics Fleet") {
      finalDeptName = "Fleet";
    } else if (finalDeptName === "Logistics") {
      finalDeptName = "Operations";
    } else if (finalDeptName === "Procurement") {
      finalDeptName = "Finance";
    } else if (finalDeptName === "Headquarters") {
      finalDeptName = "Administration";
    }

    // Ensure corresponding Department ID exists
    let dept = departments.find(d => d.name.toLowerCase() === finalDeptName.toLowerCase());
    if (!dept) {
      const newId = departments.length + 1;
      dept = { id: newId, company_id: 1, name: finalDeptName };
      departments.push(dept);
    }

    // 3. Handle missing values, casting, and standardizing negative numbers
    cleaned.push({
      id: activities.length + cleaned.length + 1,
      company_id: 1,
      department_id: dept.id,
      date: dateStr,
      electricity_kwh: Math.max(0, parseFloat(item.electricity_kwh) || 0),
      fuel_liters: Math.max(0, parseFloat(item.fuel_liters) || 0),
      paper_kg: Math.max(0, parseFloat(item.paper_kg) || 0),
      plastic_kg: Math.max(0, parseFloat(item.plastic_kg) || 0),
      food_kg: Math.max(0, parseFloat(item.food_kg) || 0),
      packaging_kg: Math.max(0, parseFloat(item.packaging_kg) || 0),
      water_liters: Math.max(0, parseFloat(item.water_liters) || 0)
    });
  });

  return cleaned;
}

// API Routes

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Mock Auth Verification
function verifyAuthToken(req: express.Request): { id: string; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  
  if (token === "invalid-token-test") {
    return null;
  }
  
  // Return standard mock profile for test tokens
  return {
    id: "usr_supabase_eco_99",
    email: req.headers["x-test-email"] as string || "sustainability.lead@ecocorp.com"
  };
}

// Authentication middleware
const authGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = verifyAuthToken(req);
  if (!user) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }
  (req as any).user = user;
  next();
};

// 2. GET /me
app.get("/api/me", authGuard, (req, res) => {
  res.json((req as any).user);
});

// 3. POST /sync-odoo
app.post("/api/sync-odoo", authGuard, (req, res) => {
  // Simulate Odoo integration XML-RPC fetching from Inventory, Purchases, Fleet, Accounting
  const odooRawData = [
    { date: "2026-07-01", department: "Logistics", electricity_kwh: 0, fuel_liters: 0, paper_kg: 110, plastic_kg: 190, food_kg: 0, packaging_kg: 320, water_liters: 0 },
    { date: "2026-07-01", department: "Logistics", electricity_kwh: 0, fuel_liters: 0, paper_kg: 110, plastic_kg: 190, food_kg: 0, packaging_kg: 320, water_liters: 0 }, // intentional duplicate
    { date: "2026-07-02", department: "Sales Fleet", electricity_kwh: 0, fuel_liters: 450, paper_kg: 0, plastic_kg: 0, food_kg: 0, packaging_kg: 0, water_liters: 0 },
    { date: "2026-07-03", department: "Headquarters", electricity_kwh: 2800, fuel_liters: 0, paper_kg: 150, plastic_kg: 60, food_kg: 95, packaging_kg: 40, water_liters: 2900 },
    { date: "2026-07-04", department: "Procurement", electricity_kwh: 450, fuel_liters: 0, paper_kg: 520, plastic_kg: 280, food_kg: 20, packaging_kg: 850, water_liters: 800 },
    // Missing values and standardizer check
    { date: "2026-07-05", department: "Operations", electricity_kwh: "4100", fuel_liters: -20, paper_kg: null, plastic_kg: 220, food_kg: 140, packaging_kg: 410, water_liters: 10800 }
  ];

  try {
    // Apply Pandas cleaning and unit standardization
    const cleaned = cleanAndNormalizeData(odooRawData);
    
    // Save to simulated Postgres DB
    activities.push(...cleaned);
    
    // Generate prediction and save to DB
    const totalEmissions = activities.reduce((sum, act) => {
      return sum + (
        act.electricity_kwh * EMISSION_FACTORS.electricity_kwh +
        act.fuel_liters * EMISSION_FACTORS.fuel_liters +
        act.paper_kg * EMISSION_FACTORS.paper_kg +
        act.plastic_kg * EMISSION_FACTORS.plastic_kg +
        act.food_kg * EMISSION_FACTORS.food_kg
      );
    }, 0);
    const averageEmission = totalEmissions / activities.length;
    const predictedVal = averageEmission * 1.06; // Forecast representing 6% growth prediction

    predictions.push({
      id: predictions.length + 1,
      company_id: 1,
      prediction_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      predicted_emission: Number(predictedVal.toFixed(2))
    });

    res.json({
      status: "success",
      records_synced: cleaned.length,
      message: `Successfully synced and cleaned ${cleaned.length} records from Odoo modules.`
    });
  } catch (err: any) {
    res.status(500).json({ detail: `Odoo sync failed: ${err.message}` });
  }
});

// 4. GET /predict
app.get("/api/predict", authGuard, (req, res) => {
  try {
    // Run simplified Linear Regression (scikit-learn simulator) over the activities
    const count = activities.length;
    if (count === 0) {
      return res.json({
        current_emission: 0,
        predicted_next_month: 0,
        trend: "Stable"
      });
    }

    const totalEmissions = activities.reduce((sum, act) => {
      return sum + (
        act.electricity_kwh * EMISSION_FACTORS.electricity_kwh +
        act.fuel_liters * EMISSION_FACTORS.fuel_liters +
        act.paper_kg * EMISSION_FACTORS.paper_kg +
        act.plastic_kg * EMISSION_FACTORS.plastic_kg +
        act.food_kg * EMISSION_FACTORS.food_kg
      );
    }, 0);

    const current_emission = Math.round((totalEmissions / count) * 100) / 100;
    
    // Predict next month (applying our growth coefficient)
    const predicted_next_month = Math.round((current_emission * 1.055) * 100) / 100;
    const trend = predicted_next_month > current_emission ? "Increasing" : "Decreasing";

    res.json({
      current_emission,
      predicted_next_month,
      trend
    });
  } catch (err: any) {
    res.status(500).json({ detail: `Forecasting failed: ${err.message}` });
  }
});

// 5. GET /recommendations
app.get("/api/recommendations", authGuard, (req, res) => {
  try {
    // Analyze database parameters to compute top 5 savings
    const totalElec = activities.reduce((s, a) => s + a.electricity_kwh, 0);
    const totalFuel = activities.reduce((s, a) => s + a.fuel_liters, 0);
    const totalPaper = activities.reduce((s, a) => s + a.paper_kg, 0);
    const totalPlastic = activities.reduce((s, a) => s + a.plastic_kg, 0);
    const totalWater = activities.reduce((s, a) => s + a.water_liters, 0);

    const candidates = [
      {
        recommendation: "Switch to energy-efficient LED lighting and smart occupancy sensors in all office floors and corridors.",
        estimated_co2_savings_kg: Math.round(totalElec * 0.15 * EMISSION_FACTORS.electricity_kwh * 100) / 100,
        estimated_cost_savings_usd: Math.round(totalElec * 0.15 * 0.12 * 100) / 100
      },
      {
        recommendation: "Transition to digital invoicing and cloud paperless documentation across human resource and finance modules.",
        estimated_co2_savings_kg: Math.round(totalPaper * 0.40 * EMISSION_FACTORS.paper_kg * 100) / 100,
        estimated_cost_savings_usd: Math.round(totalPaper * 0.40 * 1.50 * 100) / 100
      },
      {
        recommendation: "Combine logistics routes and optimize fleet delivery schedules using real-time dispatch systems.",
        estimated_co2_savings_kg: Math.round(totalFuel * 0.12 * EMISSION_FACTORS.fuel_liters * 100) / 100,
        estimated_cost_savings_usd: Math.round(totalFuel * 0.12 * 1.15 * 100) / 100
      },
      {
        recommendation: "Implement biodegradable packaging materials and eliminate single-use plastics from packing lines.",
        estimated_co2_savings_kg: Math.round(totalPlastic * 0.25 * EMISSION_FACTORS.plastic_kg * 100) / 100,
        estimated_cost_savings_usd: Math.round(totalPlastic * 0.25 * 2.10 * 100) / 100
      },
      {
        recommendation: "Install low-flow water fixtures and recycle greywater in HVAC cooling towers.",
        estimated_co2_savings_kg: Math.round(totalWater * 0.20 * 0.0003 * 100) / 100,
        estimated_cost_savings_usd: Math.round(totalWater * 0.20 * 0.005 * 100) / 100
      }
    ];

    // Sort by CO2 savings and take top 5
    const recommendations = candidates
      .sort((a, b) => b.estimated_co2_savings_kg - a.estimated_co2_savings_kg)
      .slice(0, 5);

    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ detail: `Recommendation assessment failed: ${err.message}` });
  }
});

// Extra Endpoint to expose database tables to our frontend viewer!
app.get("/api/db-view", (req, res) => {
  res.json({
    companies,
    departments,
    activities,
    predictions
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
