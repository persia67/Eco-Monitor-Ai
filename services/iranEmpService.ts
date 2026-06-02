import { Exhaust, PollutantData } from "../types";

export interface IranEmpSettings {
  apiKey: string;
  secretKey: string;
  apiUrl: string;
  useProxy: boolean;
  proxyUrl: string;
}

const DEFAULT_SETTINGS: IranEmpSettings = {
  apiKey: "6752774a-7649-464e-8ad4-9aa2f33b12f0",
  secretKey: "Sd0CHLekg/nWOSP3pjlsALzjTZCMRRd2CpkP6CNagyc=",
  apiUrl: "https://iranemp.ir/api/v1/monitoring/data",
  useProxy: true,
  proxyUrl: "/api/iranemp/data", // Bypasses CORS using the local Vite server proxy setup
};

// Store and retrieve settings in localStorage
export const getIranEmpSettings = (): IranEmpSettings => {
  try {
    const saved = localStorage.getItem("ecomonitor_iranemp_settings");
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load IranEMP settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveIranEmpSettings = (settings: IranEmpSettings) => {
  try {
    localStorage.setItem("ecomonitor_iranemp_settings", JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save IranEMP settings", e);
  }
};

/**
 * Calculates Token Key based on the exact SHA-256 algorithm specified by the user's C# code:
 * 1. Concatenate apiKey + secretKey
 * 2. Hash combined string with SHA-256
 * 3. Convert generated hash into Base64 encoded string
 */
export const getIranEmpTokenKey = async (apiKey: string, secretKey: string): Promise<string> => {
  try {
    const combined = apiKey + secretKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convert binary to Base64 String
    const binaryString = hashArray.map((b) => String.fromCharCode(b)).join("");
    return btoa(binaryString);
  } catch (error) {
    console.error("Error generating IranEMP token key:", error);
    throw new Error("خطا در ایجاد توکن امنیتی SHA-256");
  }
};

/**
 * Mapped response item from iranemp.ir
 */
export interface IranEmpStackResponse {
  stackId: string;
  name: string;
  location: string;
  lastUpdateTime: string;
  measurements: {
    CO: number;
    CO2: number;
    SO2: number;
    NOx: number;
    PM: number;
    O2: number;
    [key: string]: number;
  };
}

/**
 * Generates sample IranEMP data representing real industrial chimney stacks
 */
export const getIranEmpMockData = (): IranEmpStackResponse[] => {
  return [
    {
      stackId: "IranEMP-001",
      name: "دودکش بویلر شماره ۱ (خروجی شرق کارخانه)",
      location: "سالن دیگ بخار - ضلع شرقی مجتمع صنعتی",
      lastUpdateTime: new Date().toLocaleDateString("fa-IR"),
      measurements: {
        CO: 185.4,
        CO2: 8.2,
        SO2: 120.1,
        NOx: 344.2,
        PM: 42.1,
        O2: 4.5,
      },
    },
    {
      stackId: "IranEMP-002",
      name: "دودکش توربین گازی فاز اصلی",
      location: "نیروگاه پشتیبان - فاز توسعه جنوب غرب",
      lastUpdateTime: new Date().toLocaleDateString("fa-IR"),
      measurements: {
        CO: 45.2,
        CO2: 12.1,
        SO2: 15.0,
        NOx: 112.5,
        PM: 8.4,
        O2: 13.2,
      },
    },
    {
      stackId: "IranEMP-003",
      name: "مشعل زباله‌سوز و تصفیه حرارتی گازها",
      location: "محل دفع فیلترها و پسماند کوره شمالی",
      lastUpdateTime: new Date().toLocaleDateString("fa-IR"),
      measurements: {
        CO: 290.5,
        CO2: 14.8,
        SO2: 490.2,
        NOx: 480.9,
        PM: 165.4,
        O2: 2.8,
      },
    },
    {
      stackId: "IranEMP-004",
      name: "کوره ذوب مجدد و پیش‌گرم کن چدن",
      location: "سالن ذوب و ریخته‌گری - سوله B",
      lastUpdateTime: new Date().toLocaleDateString("fa-IR"),
      measurements: {
        CO: 110.0,
        CO2: 6.5,
        SO2: 85.3,
        NOx: 195.0,
        PM: 28.1,
        O2: 6.1,
      },
    },
  ];
};

/**
 * Synchronizes and maps raw IranEMP response array to the app's Exhaust representation
 */
export const mapIranEmpToExhausts = (stacks: IranEmpStackResponse[], currentExhausts: Exhaust[]): Exhaust[] => {
  // First, map incoming items to standard Exhaust structure
  const mapped: Exhaust[] = stacks.map((stack, index) => {
    // Check if an exhaust with exact same name already exists to preserve its previous history
    const existing = currentExhausts.find(e => e.name === stack.name || e.id === (index + 100));
    
    const pollutantData: PollutantData = {
      CO: stack.measurements.CO || 0,
      CO2: stack.measurements.CO2 || 0,
      SO2: stack.measurements.SO2 || 0,
      NOx: stack.measurements.NOx || 0,
      PM: stack.measurements.PM || 0,
      O2: stack.measurements.O2 || 0,
    };

    const newHistoryItem = {
      period: `پایش پورتال IranEMP - ${stack.stackId}`,
      date: stack.lastUpdateTime || new Date().toLocaleDateString("fa-IR"),
      data: pollutantData,
    };

    const history = existing ? [...existing.history, newHistoryItem] : [newHistoryItem];

    return {
      id: existing ? existing.id : (index + 100), // High index range to avoid clash with local ones
      name: stack.name,
      location: stack.location,
      data: pollutantData,
      history: history,
      lastCheck: stack.lastUpdateTime || new Date().toLocaleDateString("fa-IR"),
    };
  });

  // Merge them by keeping existing ones that weren't overwritten or append
  const mergedExhausts = [...currentExhausts];
  
  mapped.forEach(m => {
    const idx = mergedExhausts.findIndex(e => e.name === m.name);
    if (idx !== -1) {
      mergedExhausts[idx] = m;
    } else {
      mergedExhausts.push(m);
    }
  });

  return mergedExhausts;
};

/**
 * Fetches monitoring data from the official IranEMP API endpoints
 */
export const fetchIranEmpData = async (
  settings: IranEmpSettings
): Promise<IranEmpStackResponse[]> => {
  const url = settings.useProxy ? settings.proxyUrl : settings.apiUrl;
  const tokenKey = await getIranEmpTokenKey(settings.apiKey, settings.secretKey);

  const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": settings.apiKey,
    "X-Token-Key": tokenKey,
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`خطای سرور IranEMP (کد: ${response.status}) ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      return data as IranEmpStackResponse[];
    }
    
    // If the return object is nested inside some common wrappers
    if (data && typeof data === "object") {
      if (Array.isArray(data.data)) return data.data as IranEmpStackResponse[];
      if (Array.isArray(data.result)) return data.result as IranEmpStackResponse[];
      if (Array.isArray(data.items)) return data.items as IranEmpStackResponse[];
    }

    throw new Error("قالب داده دریافتی از پورتال IranEMP نامعتبر است.");
  } catch (error: any) {
    console.error("IranEMP Fetch Error:", error);
    throw error;
  }
};
