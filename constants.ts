import { Standards, Diagnostics, Exhaust } from './types';

// ISO Standards for pollutants (mg/Nm³)
export const STANDARDS: Standards = {
  CO: { limit: 100, unit: 'mg/Nm³', name: 'مونوکسید کربن' },
  CO2: { limit: 500, unit: 'mg/Nm³', name: 'دی‌اکسید کربن' },
  SO2: { limit: 200, unit: 'mg/Nm³', name: 'دی‌اکسید گوگرد' },
  NOx: { limit: 150, unit: 'mg/Nm³', name: 'اکسیدهای نیتروژن' },
  PM: { limit: 50, unit: 'mg/Nm³', name: 'ذرات معلق' }
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
  }
};

export const INITIAL_EXHAUSTS: Exhaust[] = [
  { 
    id: 1, 
    name: 'اگزوز بویلر شماره 1', 
    data: { CO: 85, CO2: 420, SO2: 180, NOx: 140, PM: 45 },
    location: 'سالن تولید A',
    lastCheck: '1403/10/15'
  },
  { 
    id: 2, 
    name: 'اگزوز بویلر شماره 2', 
    data: { CO: 120, CO2: 550, SO2: 220, NOx: 180, PM: 65 },
    location: 'سالن تولید B',
    lastCheck: '1403/10/15'
  }
];