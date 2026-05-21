import { Exhaust } from "../types";
import { STANDARDS } from "../constants";

export type AiEngineMode = "gemini" | "ollama" | "huggingface";

export interface LocalAiSettings {
  mode: AiEngineMode;
  ollamaUrl: string;
  ollamaModel: string;
  huggingFaceModel: string;
  isModelDownloaded: boolean;
  downloadProgress: number;
  downloadSpeed: string;
  downloadStatus: "idle" | "downloading" | "ready" | "error";
}

const DEFAULT_SETTINGS: LocalAiSettings = {
  mode: "gemini",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3",
  huggingFaceModel: "ecomonitor-llama-nlp-fa-1.5b",
  isModelDownloaded: false,
  downloadProgress: 0,
  downloadSpeed: "0 MB/s",
  downloadStatus: "idle",
};

// Store and retrieve AI settings in localStorage
export const getLocalAiSettings = (): LocalAiSettings => {
  try {
    const saved = localStorage.getItem("ecomonitor_ai_settings");
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load local ai settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveLocalAiSettings = (settings: LocalAiSettings) => {
  try {
    localStorage.setItem("ecomonitor_ai_settings", JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save local ai settings", e);
  }
};

// Static Farsi rule-based local expert system to provide beautiful offline results instantly
// in case there's no network or connection to external services.
export const generateLocalExpertAnalysis = (exhaustData: Exhaust): string => {
  const violations: string[] = [];
  const warnings: string[] = [];
  const normalPollutants: string[] = [];
  
  Object.entries(exhaustData.data).forEach(([pollutant, value]) => {
    const std = STANDARDS[pollutant];
    if (!std) return;

    if (pollutant === "O2") {
      // Oxygen status handling (usually between 3-6% is optimal for industrial boilers)
      if (value < 3) {
        warnings.push(`سطح اکسیژن (${value}٪) بسیار پایین است که نشانه احتراق ناقص و ترشح منوکسید کربن است.`);
      } else if (value > 6) {
        warnings.push(`سطح اکسیژن (${value}٪) بالا است که باعث افزایش اتلاف حرارت از دودکش و کاهش راندمان بویلر می‌شود.`);
      } else {
        normalPollutants.push(`میزان اکسیژن (${value}٪) در محدوده بهینه (۳ تا ۶٪) برای احتراق کامل و راندمان بالا قرار دارد.`);
      }
    } else {
      if (value > std.limit) {
        violations.push(`**${std.name} (${pollutant}):** مقدار ثبت شده ${value} ${std.unit} است که بالاتر از حد استاندارد (${std.limit} ${std.unit}) می‌باشد.`);
      } else if (value > std.limit * 0.8) {
        warnings.push(`**${std.name} (${pollutant}):** مقدار ثبت شده ${value} ${std.unit} به حد بحرانی استاندارد (${std.limit} ${std.unit}) نزدیک شده است.`);
      } else {
        normalPollutants.push(`**${std.name} (${pollutant}):** مقدار ثبت شده ${value} ${std.unit} در محدوده سالم و استاندارد است.`);
      }
    }
  });

  const timestamp = new Date().toLocaleDateString("fa-IR");
  
  let report = `### 📊 گزارش پایش هوشمند و تحلیل فنی آلاینده‌ها (نسخه آفلاین محلی)
**نام تجهیز:** ${exhaustData.name}
**موقعیت جغرافیایی:** ${exhaustData.location}
**تاریخ گزارش پایش:** ${timestamp}

---

### ۱. 🔍 تحلیل کلی وضعیت پایش محیط زیستی (ISO 14001)
`;

  if (violations.length === 0) {
    report += `🟢 **وضعیت فرآیند:** همه مؤلفه‌های گازی و معلق در این سیستم در محدوده استانداردهای ملی سازمان حفاظت محیط زیست قرار دارند. فرآیند احتراق بویلر پایدار و مناسب ارزیابی شده است.\n\n`;
  } else {
    report += `🔴 **وضعیت فرآیند:** خروجی بویلر دارای مغایرت‌های جدی با استانداردهای مصوب سازمان محیط زیست است. نیاز به عیب‌یابی فوری و تنظیم نسبت هوا به سوخت وجود دارد.\n\n`;
  }

  // Add details of violations and warnings
  if (violations.length > 0) {
    report += `#### 🚨 مغایرت‌های زیست‌محیطی (خارج از رنج استاندارد):\n`;
    violations.forEach(v => {
      report += `${v}\n`;
    });
    report += `\n`;
  }

  if (warnings.length > 0) {
    report += `#### ⚠️ پایش‌های نیازمند توجه ویژه:\n`;
    warnings.forEach(w => {
      report += `${w}\n`;
    });
    report += `\n`;
  }

  if (normalPollutants.length > 0) {
    report += `#### ❇️ شاخص‌های نرمال و تأیید شده:\n`;
    normalPollutants.forEach(n => {
      report += `${n}\n`;
    });
    report += `\n`;
  }

  report += `---

### ۲. 🛠️ پیشنهادهای فنی و راهکارهای مهندسی جهت بهبود فرآیند
`;

  // Tailored recommendations based on data
  if (exhaustData.data.CO > STANDARDS.CO.limit || exhaustData.data.O2 < 3) {
    report += `- **تنظیم نسبت سوخت و هوا:** مقدار بالای CO نشان‌دهنده نقص جدی در سیستم تامین هوای مشعل است. جریان هوای احتراقی را افزایش داده و مشعل را کالیبره کنید.\n`;
  }
  if (exhaustData.data.NOx > STANDARDS.NOx.limit) {
    report += `- **پایش دمای احتراق و NOx:** مقدار زیاد NOx نشانه بالا بودن دمای شعله در بویلر است. استفاده از فن بازچرخش گازهای دودکش (FGR) یا بکارگیری دمپرهای تعدیل دما پیشنهاد می‌شود.\n`;
  }
  if (exhaustData.data.SO2 > STANDARDS.SO2.limit) {
    report += `- **کنترل گوگرد سوخت مصرفی:** مقدار بالای SO2 مربوط به وجود ناخالصی گوگرد در سوخت مایع (مازوت/گازوئیل) است. فیلترها و مرطوب‌کننده برج شستشو (Scrubber) را بررسی نموده یا سوخت با کیفیت بالاتر تامین کنید.\n`;
  }
  if (exhaustData.data.PM > STANDARDS.PM.limit) {
    report += `- **سرویس غبارگیرها و بک‌فیلتر:** ذرات معلق خروجی بیش از حد مجاز است. سیستم غبارگیر صنعتی (الکتروفیلتر یا بگ‌فیلتر) را جهت پاره‌گی و گرفتگی کیسه‌ها به دقت عیب‌یابی کنید.\n`;
  }
  
  report += `- **کالیبراسیون سنسورهای پایش آنلاین:** در راستای الزامات خوداظهاری پایش مداوم، دوره‌های بررسی و کالیبراسیون سنسورهای زیرمجموعه در فواصل منظم تکرار گردد.
- **بهینه‌سازی مشعل در بار نامی:** راندمان حرارتی بویلر با تنظیم دمپر سوخت در بازه‌های باری مختلف مورد ارزیابی آزمایشگاهی قرار گیرد.

---

### ۳. 📌 اولویت‌بندی نیازمندی‌های عیب‌یابی سیستم
| ردیف | شرح اقدام اصلاحی | اولویت کارشناس | بخش مربوطه |
|:---:|:---|:---:|:---:|
| ۱ | کالیبراسیون سالانه و تنظیم دمپر هوا | ${violations.length > 0 ? "⚠️ حیاتی (Critical)" : "متوسط"} | تعمیرات و نگهداری بویلر |
| ۲ | بازرسی سلامت کیسه‌های بگ‌فیلتر / تجهیزات غبارگیر | ${exhaustData.data.PM > STANDARDS.PM.limit ? "⚠️ بحرانی" : "پایین"} | بهداشت و محیط زیست (HSE) |
| ۳ | نصب انالایزر پرتابل خروجی دودکش جهت اعتبارسنجی | کم | آزمایشگاه شیمی |
`;

  return report;
};

// Local chatbot responding offline
export const generateLocalExpertChatResponse = (message: string): string => {
  const cleanMsg = message.toLowerCase();
  
  if (cleanMsg.includes("سلام") || cleanMsg.includes("سلامدورو") || cleanMsg.includes("hello") || cleanMsg.includes("hi")) {
    return `درود بر شما کاربر گرامی! من هسته عیب‌یابی کاملاً آفلاین سیستم پایش آلاینده‌ها (EcoMonitor Local AI) هستم. 
در صورت قطع بودن اینترنت، به شکل کاملاً آفلاین و سریع در کنار شما هستم. می‌توانید درباره استانداردهای بویلر، ارقام خروجی، گازهای آلاینده یا نحوه بهبود بازده احتراق بپرهیزید.`;
  }

  if (cleanMsg.includes("co") || cleanMsg.includes("کربن") || cleanMsg.includes("مونوکسید") || cleanMsg.includes("مونوکسيد")) {
    return `کربن مونوکسید (CO) گاز سمی و اشتعال‌پذیر است که افزایش آن در گازهای دودکش بویلر نشانه **احتراق ناقص** سوخت است.
**دلایل اصلی افزایش CO:**
۱. کمبود اکسیژن آزاد خروجی بویلر (کم بودن نسبت هوا به سوخت)
۲. مخلوط‌سازی بی کیفیت هوا و سوخت توسط مشعل
۳. کثیفی کلاهک مشعل یا نقص نازل سوخت

**استاندارد مصوب سازمان حفاظت محیط زیست:** مقدار مجاز CO برای بویلرهای گازسوز معمولاً زیر **150 mg/m³** است.`;
  }

  if (cleanMsg.includes("nox") || cleanMsg.includes("نیتروژن") || cleanMsg.includes("اکسید")) {
    return `اکسیدهای نیتروژن (NOx) به طور کلی حاصل از ترکیب نیتروژن هوا در اثر **دمای بالای احتراق** در مشعل‌ها تولید می‌شوند (Thermal NOx).
**مؤثرترین روش‌های کاهش میزان NOx:**
۱. اجرای طرح بازچرخش گازهای خروجی دودکش (Flue Gas Recirculation یا FGR) جهت پایین آوردن حداکثر دمای شعله
۲. استفاده از مشعل‌های نوین کاهنده اکسیدهای نیتروژن (Low-NOx Burners) که شعله پیوسته را به شعله چند مرحله‌ای تقسیم می‌کنند
۳. کنترل هوای ترجیحی احتراق

**محدوده استاندارد سازمان محیط زیست:** مقدار مجاز NOx در بویلرهای گازی تا حد اکثر **350 mg/m³** می‌باشد.`;
  }

  if (cleanMsg.includes("so2") || cleanMsg.includes("گوگرد") || cleanMsg.includes("سولفور")) {
    return `دی‌اکسید گوگرد (SO2) مستقیماً ناشی از وجود گوگرد در ترکیب سوخت ورودی است.
**راهکارهای اصلی کاهش SO2:**
۱. تغییر سوخت مصرفی به سوخت‌های با گوگرد کمتر (مانند جایگزینی مازوت با گاز طبیعی)
۲. تزریق جاذب‌های کلسیم یا آهک در کوره
۳. استفاده از سیستم پاشش مرطوب برج اسکرابر (Scrubber) در مسیر دودکش

**محدوده مجاز استاندارد:** مقدار خروجی SO2 برای سوخت‌های تمیز گازی نباید از **200 mg/m³** فراتر رود.`;
  }

  if (cleanMsg.includes("pm") || cleanMsg.includes("ذره") || cleanMsg.includes("گرد") || cleanMsg.includes("غبار") || cleanMsg.includes("دوده")) {
    return `ذرات معلق (PM) نشان‌دهنده نقص در اتمیزه شدن سوخت‌های مایع یا وجود ترکیبات نسوخته جامد است.
**روش‌های فیلتراسیون ذرات معلق:**
۱. تمیزکاری فیزیکی شعله، پایش سیستم اتمایزر و تنظیم فشار گازوئیل/مازوت
۲. استفاده از سیستم فیلترینگ کیسه‌ای (Bag Filter) یا غبارگیرهای سایکلونی برای بازدهی سریع و کامل
۳. الکترواستاتیک پرسیپیتاتورها (ESP) در مقياس‌های بزرگ صنعتی

**محدوده استاندارد سازمان محیط زیست:** برای واحدهای نو بنیاد گازی، حد استاندارد PM کمتر از **50 mg/m³** تعریف شده است.`;
  }

  if (cleanMsg.includes("o2") || cleanMsg.includes("اکسیژن") || cleanMsg.includes("اکسيژن")) {
    return `میزان اکسیژن اضافه (Excess O2) در دودکش، شاخص حیاتی راندمان حرارتی است.
- **حد بهینه O2:** معمولاً بین **۳ تا ۶ درصد** برای احتراق سوخت گازی است.
- **کمتر از ۲٪ O2:** خطر احتراق ناقص، تولید دوده، افزایش شدید انتشار CO زهرآگین و هدررفت شدید سوخت ارگانیک.
- **بیشتر از ۶٪ O2:** هدررفت انرژی حرارتی بویلر از طریق داغ کردن هوای اضافی ورودی و بالا بردن دمای گازهای تخلیه خروجی.`;
  }

  if (cleanMsg.includes("iso") || cleanMsg.includes("ایزو") || cleanMsg.includes("استاندارد")) {
    return `سیستم پایش آلاینده‌های EcoMonitor منطبق با الزامات **استاندارد خانواده ISO 14001 (مدیریت زیست‌محیطی)** طراحی شده است.
این سیستم به کارخانجات صنعتی کمک می‌کند تا:
۱. فرآیند پایش مداوم و خوداظهاری محیط زیست را مستند کنند.
۲. با تنظیم نسبت احتراق، مصرف کربنی را به حداقل برسانند.
۳. در مواقع تجاوز از حد بحرانی، با هشدارهای زمان فرعی مانع از جریمه‌های سنگین مراجع قانونی شوند.`;
  }

  return `من پیام شما را ثبت کردم. به عنوان دستیار آفلاین بویلر و سیستم‌های اگزوز صنعتی، پیشنهاد می‌کنم برای رفع عیب یا تحلیل با من درباره موارد زیر صحبت کنید:
- میزان اکسیژن بهینه دودکش (O2)
- روش‌های کاهش اکسیدهای نیتروژن (NOx)
- پیامدهای بالا رفتن غلظت کربن مونوکسید (CO)
- استانداردهای پایش زیست‌محیطی ISO 14001`;
};

// Actual remote call to local Ollama API
export const queryLocalOllama = async (prompt: string, settings: LocalAiSettings): Promise<string> => {
  const url = `${settings.ollamaUrl}/api/generate`;
  
  const systemPrompt = `You are an expert environmental engineer and EcoMonitor assistant. Respond in Persian (Farsi) concisely. Translate any technical term properly. Prompt: ${prompt}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.ollamaModel,
        prompt: systemPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`Ollama HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "خطا: خروجی خالی از مدل Ollama دریافت شد.";
  } catch (err: any) {
    console.error("Failed to fetch Ollama API", err);
    throw new Error(`عدم امکان ارتباط با Ollama در آدرس ${settings.ollamaUrl}. اطمینان حاصل کنید که Ollama روشن است و CORS با خروجی مناسب فعال است. (Error: ${err.message})`);
  }
};
