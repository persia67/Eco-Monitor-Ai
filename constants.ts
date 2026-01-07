import { Standards, Diagnostics, Exhaust } from './types';

// ISO Standards for pollutants (mg/Nm³) and O2 (%)
export const STANDARDS: Standards = {
  CO: { limit: 100, unit: 'mg/Nm³', name: 'مونوکسید کربن' },
  CO2: { limit: 500, unit: 'mg/Nm³', name: 'دی‌اکسید کربن' },
  SO2: { limit: 200, unit: 'mg/Nm³', name: 'دی‌اکسید گوگرد' },
  NOx: { limit: 150, unit: 'mg/Nm³', name: 'اکسیدهای نیتروژن' },
  PM: { limit: 50, unit: 'mg/Nm³', name: 'ذرات معلق' },
  O2: { limit: 6, unit: '%', name: 'اکسیژن' }
};

// Diagnostic system based on pollutant levels
export const DIAGNOSTIC_SYSTEM: Diagnostics = {
  CO: {
    high: 'احتراق ناقص - بررسی نسبت هوا به سوخت، تنظیم مشعل‌ها',
    veryHigh: 'نقص جدی در احتراق - بررسی فوری سیستم تهویه و مشعل‌ها'
  },
  CO2: {
    high: 'افزایش مصرف سوخت - بهینه‌سازی فرآیند احتراق',
    veryHigh: 'عدم کارایی سیستم - بررسی عایق‌بندی و تبادل حرارت'
  },
  SO2: {
    high: 'محتوای گوگرد بالا در سوخت - استفاده از سوخت با کیفیت بهتر',
    veryHigh: 'نیاز به سیستم دسولفوریزاسیون یا تعویض سوخت'
  },
  NOx: {
    high: 'دمای احتراق بالا - کاهش دما، استفاده از مشعل‌های NOx پایین',
    veryHigh: 'نیاز به سیستم SCR یا SNCR برای کاهش NOx'
  },
  PM: {
    high: 'احتراق ناکامل - بررسی سیستم فیلتراسیون و مشعل‌ها',
    veryHigh: 'نقص در سیستم فیلتر - تعویض یا تعمیر فیلترها'
  },
  O2: {
    high: 'هوای اضافی بالا - کاهش راندمان حرارتی بویلر',
    veryHigh: 'تنظیم نادرست نسبت هوا به سوخت - اتلاف انرژی قابل توجه'
  }
};

export const INITIAL_EXHAUSTS: Exhaust[] = [
  { 
    id: 1, 
    name: 'خروجی دودکش بویلر 1 اسید شویی', 
    location: 'واحد اسید شویی',
    lastCheck: '1404/07/23',
    data: { CO: 119.98, CO2: 0, SO2: 0, NOx: 76.44, PM: 0, O2: 14 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 195.39, CO2: 0, SO2: 7.2, NOx: 57.4, PM: 0, O2: 13.8 }
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 246.13, CO2: 0, SO2: 0, NOx: 65.07, PM: 0, O2: 13.9 }
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 119.98, CO2: 0, SO2: 0, NOx: 76.44, PM: 0, O2: 14 }
      }
    ]
  },
  { 
    id: 2, 
    name: 'خروجی دودکش بویلر 2 اسید شویی', 
    location: 'واحد اسید شویی',
    lastCheck: '1404/07/23',
    data: { CO: 25.82, CO2: 0, SO2: 0, NOx: 64.54, PM: 0, O2: 13.1 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 170.05, CO2: 0, SO2: 0, NOx: 70.32, PM: 0, O2: 13.4 }
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 130.02, CO2: 0, SO2: 0, NOx: 64.79, PM: 0, O2: 13.5 }
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 25.82, CO2: 0, SO2: 0, NOx: 64.54, PM: 0, O2: 13.1 }
      }
    ]
  },
  { 
    id: 3, 
    name: 'خروجی دودکش بویلر واحد گالوانیزه', 
    location: 'واحد گالوانیزه',
    lastCheck: '1404/07/23',
    data: { CO: 2.51, CO2: 0, SO2: 0, NOx: 86.2, PM: 0, O2: 12.1 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 148.21, PM: 0, O2: 10.3 }
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 0, CO2: 0, SO2: 14.41, NOx: 60.78, PM: 0, O2: 13.8 }
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 2.51, CO2: 0, SO2: 0, NOx: 86.2, PM: 0, O2: 12.1 }
      }
    ]
  },
  { 
    id: 4, 
    name: 'خروجی دودکش کوره رنگ', 
    location: 'خط رنگ',
    lastCheck: '1404/07/23',
    data: { CO: 172.12, CO2: 0, SO2: 0, NOx: 319.64, PM: 0, O2: 17 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 0, O2: 0 } // No data
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 160.82, CO2: 0, SO2: 0, NOx: 269.7, PM: 78.14, O2: 17.7 }
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 172.12, CO2: 0, SO2: 0, NOx: 319.64, PM: 0, O2: 17 }
      }
    ]
  },
  { 
    id: 5, 
    name: 'دودکش خط نورد یک', 
    location: 'خط نورد',
    lastCheck: '1404/07/23',
    data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 50.33, O2: 0 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 35.92, O2: 0 }
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 38.84, O2: 0 }
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 50.33, O2: 0 }
      }
    ]
  },
  { 
    id: 6, 
    name: 'دودکش نورد 2', 
    location: 'خط نورد',
    lastCheck: '1404/07/23',
    data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 77.25, O2: 0 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 42.1, O2: 0 }
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 0, O2: 0 } // No data
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 77.25, O2: 0 }
      }
    ]
  },
  { 
    id: 7, 
    name: 'خروجی دودکش خط رنگ', 
    location: 'خط رنگ',
    lastCheck: '1404/06/11',
    data: { CO: 111.88, CO2: 0, SO2: 0, NOx: 0, PM: 69.95, O2: 20.7 },
    history: [
      {
        period: 'بهار ۱۴۰۴',
        date: '1404/03/25',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 0, O2: 0 } // No data
      },
      {
        period: 'تابستان ۱۴۰۴',
        date: '1404/06/11',
        data: { CO: 111.88, CO2: 0, SO2: 0, NOx: 0, PM: 69.95, O2: 20.7 }
      },
      {
        period: 'پاییز ۱۴۰۴',
        date: '1404/07/23',
        data: { CO: 0, CO2: 0, SO2: 0, NOx: 0, PM: 0, O2: 0 } // No data
      }
    ]
  }
];