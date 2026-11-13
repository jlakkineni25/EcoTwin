import { Station, StationForecast, AQICategory } from '../types';
import { CPCB_CATEGORIES, getAQICategory } from './aqi';

export type DelhiZone = 'All' | 'North' | 'South' | 'East' | 'West' | 'Central';

export interface StationZoneMeta {
  zone: DelhiZone;
  areaType: string;
  landmark: string;
}

// Official Delhi administrative zoning for all 37 monitoring stations
export const STATION_ZONE_MAPPING: Record<number, StationZoneMeta> = {
  0: { zone: 'Central', areaType: 'Commercial / Traffic Hub', landmark: 'ITO Intersection & Ring Road' },
  1: { zone: 'North', areaType: 'Industrial / Residential', landmark: 'Jahangirpuri & Outer Ring Road' },
  2: { zone: 'South', areaType: 'Institutional / Sports', landmark: 'JL Nehru Stadium & Lodhi Colony' },
  3: { zone: 'Central', areaType: 'Institutional / Green Corridor', landmark: 'National Stadium & India Gate' },
  4: { zone: 'North', areaType: 'Peri-Urban / Agricultural Gateway', landmark: 'Alipur & GT Karnal Road' },
  5: { zone: 'West', areaType: 'Residential Suburb', landmark: 'Dwarka Sector 8 & Metro Line' },
  6: { zone: 'West', areaType: 'Aviation / Transport Corridor', landmark: 'Indira Gandhi International Airport' },
  7: { zone: 'West', areaType: 'Institutional / University', landmark: 'NSIT Campus, Dwarka' },
  8: { zone: 'West', areaType: 'Peri-Urban / Rural Border', landmark: 'Najafgarh Town & Drain' },
  9: { zone: 'South', areaType: 'Protected Forest / Ridge', landmark: 'Asola Wildlife Sanctuary & Shooting Range' },
  10: { zone: 'North', areaType: 'Residential / Commercial', landmark: 'Ashok Vihar & Wazirpur Border' },
  11: { zone: 'West', areaType: 'Industrial / Logistics Corridor', landmark: 'Mundka Industrial Area & Rohtak Road' },
  12: { zone: 'East', areaType: 'Residential / Commercial', landmark: 'Patparganj & IP Extension' },
  13: { zone: 'West', areaType: 'Residential / Heavy Traffic', landmark: 'Punjabi Bagh & Ring Road Junction' },
  14: { zone: 'Central', areaType: 'Institutional / Green Oasis', landmark: 'Pusa Institute (DPCC Station)' },
  15: { zone: 'Central', areaType: 'Institutional / Research Zone', landmark: 'Pusa Campus (IITM Station)' },
  16: { zone: 'South', areaType: 'Residential / Commercial', landmark: 'R K Puram & Bhikaji Cama Place' },
  17: { zone: 'South', areaType: 'Commercial / Dense Urban', landmark: 'Nehru Nagar & Ring Road Ashram' },
  18: { zone: 'North', areaType: 'Educational / Campus', landmark: 'Delhi University North Campus' },
  19: { zone: 'South', areaType: 'Heavy Industrial / Manufacturing', landmark: 'Okhla Industrial Estate Phase-2' },
  20: { zone: 'South', areaType: 'Residential / Sports Complex', landmark: 'Sirifort & Asian Games Village' },
  21: { zone: 'East', areaType: 'Riverine / Trans-Yamuna', landmark: 'Sonia Vihar & Water Works' },
  22: { zone: 'West', areaType: 'Industrial / Commercial', landmark: 'Shadipur & Patel Nagar' },
  23: { zone: 'South', areaType: 'Commercial / Residential', landmark: 'Sri Aurobindo Marg & Hauz Khas' },
  24: { zone: 'East', areaType: 'Transit / Heavy Inversion Hotspot', landmark: 'Anand Vihar ISBT & Railway Terminal' },
  25: { zone: 'North', areaType: 'University / Suburb', landmark: 'Delhi Technological University (DTU)' },
  26: { zone: 'Central', areaType: 'Historical / Low-Density Park', landmark: 'Lodhi Road & India Habitat Centre' },
  27: { zone: 'Central', areaType: 'Heritage / High-Density Market', landmark: 'Chandni Chowk & Old Delhi' },
  28: { zone: 'North', areaType: 'Industrial Corridor', landmark: 'Bawana Industrial Area' },
  29: { zone: 'North', areaType: 'Corridor / Transport', landmark: 'Burari Crossing & Outer Ring Road' },
  30: { zone: 'South', areaType: 'Research / Highway', landmark: 'CRRI Mathura Road & Apollo Hospital' },
  31: { zone: 'North', areaType: 'Industrial / Agricultural Border', landmark: 'Narela Sub-City & Industrial Area' },
  32: { zone: 'East', areaType: 'Residential Suburb', landmark: 'Vivek Vihar & Anand Vihar Border' },
  33: { zone: 'Central', areaType: 'Government / Low Density', landmark: 'Mandir Marg & Connaught Place West' },
  34: { zone: 'North', areaType: 'Large Planned Suburb', landmark: 'Rohini Sector 16 & Deepali Chowk' },
  35: { zone: 'South', areaType: 'Aravalli Border / Southern Ridge', landmark: 'Aya Nagar & Mehrauli Border' },
  36: { zone: 'North', areaType: 'Dense Industrial Basin', landmark: 'Wazirpur Industrial Area' },
};

export const DELHI_ZONES: { id: DelhiZone; label: string; count: number }[] = [
  { id: 'All', label: 'All Delhi', count: 37 },
  { id: 'North', label: 'North Delhi', count: 10 },
  { id: 'South', label: 'South Delhi', count: 9 },
  { id: 'East', label: 'East Delhi', count: 4 },
  { id: 'West', label: 'West Delhi', count: 7 },
  { id: 'Central', label: 'Central Delhi', count: 7 },
];

export interface CitizenHealthGuidance {
  outdoorExercise: {
    status: 'Safe' | 'Caution' | 'Indoor Exercise Preferred';
    title: string;
    description: string;
    icon: string;
  };
  masksProtection: {
    status: 'Not Needed' | 'Recommended' | 'Strongly Recommended';
    title: string;
    description: string;
    icon: string;
  };
  homeVentilation: {
    status: 'Open Windows' | 'Limit Ventilation' | 'Keep Windows Closed';
    title: string;
    description: string;
    icon: string;
  };
  sensitiveGroups: {
    status: 'Normal' | 'Take Precaution' | 'Extra Care Advised';
    title: string;
    description: string;
    icon: string;
  };
}

export function formatObservationTimestamp(ts: string): {
  formattedDate: string;
  formattedTime: string;
  fullLabel: string;
} {
  if (!ts) {
    return {
      formattedDate: 'Dec 8, 2025',
      formattedTime: '12:00 PM',
      fullLabel: 'Dec 8, 2025 at 12:00 PM · Historical CPCB Station Record',
    };
  }

  try {
    const parts = ts.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '12:00';
    const [year, month, day] = datePart.split('-');
    const [hour, minute] = timePart.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(month, 10) - 1;
    const mName = monthNames[mIdx] || 'Dec';

    const formattedDate = `${mName} ${parseInt(day, 10)}, ${year}`;
    const formattedTime = `${displayHour}:${minute} ${ampm}`;

    return {
      formattedDate,
      formattedTime,
      fullLabel: `${formattedDate} at ${formattedTime} · Historical CPCB Station Record`,
    };
  } catch {
    return {
      formattedDate: 'Dec 8, 2025',
      formattedTime: '12:00 PM',
      fullLabel: `${ts} · Historical CPCB Station Record`,
    };
  }
}

export function getCitizenHealthGuidance(pm25: number): CitizenHealthGuidance {
  if (pm25 <= 30) {
    return {
      outdoorExercise: {
        status: 'Safe',
        title: 'Ideal for Outdoor Sports',
        description: 'Air quality is excellent. Great time for outdoor running, cycling, and park walks.',
        icon: '🏃',
      },
      masksProtection: {
        status: 'Not Needed',
        title: 'No Mask Needed',
        description: 'Particulate levels are clean and well within national standards.',
        icon: '🍃',
      },
      homeVentilation: {
        status: 'Open Windows',
        title: 'Fresh Air Indoors',
        description: 'Open windows to circulate clean outdoor air through your rooms.',
        icon: '🪟',
      },
      sensitiveGroups: {
        status: 'Normal',
        title: 'No Special Precautions',
        description: 'Safe for children, elderly citizens, and people with asthma.',
        icon: '👶',
      },
    };
  }

  if (pm25 <= 60) {
    return {
      outdoorExercise: {
        status: 'Safe',
        title: 'Good for Exercise',
        description: 'Acceptable for most workouts. Hypersensitive athletes can run in early mornings.',
        icon: '🏃',
      },
      masksProtection: {
        status: 'Not Needed',
        title: 'Generally Not Needed',
        description: 'Only citizens with known dust allergies or acute asthma need personal protection.',
        icon: '🍃',
      },
      homeVentilation: {
        status: 'Open Windows',
        title: 'Safe to Air Out Rooms',
        description: 'Good indoor air exchange. Normal window ventilation is completely fine.',
        icon: '🪟',
      },
      sensitiveGroups: {
        status: 'Take Precaution',
        title: 'Minor Sensitivity Notice',
        description: 'Children and seniors can enjoy normal outdoor routines with reasonable hydration.',
        icon: '👶',
      },
    };
  }

  if (pm25 <= 90) {
    return {
      outdoorExercise: {
        status: 'Caution',
        title: 'Moderate Exertion',
        description: 'Reduce prolonged intense outdoor cardio. Prefer shaded parks away from major highways.',
        icon: '🚶',
      },
      masksProtection: {
        status: 'Recommended',
        title: 'Recommended on Roads',
        description: 'A light mask is helpful if commuting on two-wheelers or waiting at busy traffic junctions.',
        icon: '😷',
      },
      homeVentilation: {
        status: 'Limit Ventilation',
        title: 'Ventilate During Afternoon',
        description: 'Air out rooms between 1 PM and 4 PM when particulate concentrations are naturally lower.',
        icon: '🪟',
      },
      sensitiveGroups: {
        status: 'Take Precaution',
        title: 'Keep Inhalers Handy',
        description: 'People with asthma or dust sensitivity should keep relief inhalers accessible.',
        icon: '⚠️',
      },
    };
  }

  if (pm25 <= 120) {
    return {
      outdoorExercise: {
        status: 'Caution',
        title: 'Limit Prolonged Cardio',
        description: 'Avoid strenuous outdoor running or sports. Switch to indoor exercise or lighter walking.',
        icon: '⚠️',
      },
      masksProtection: {
        status: 'Recommended',
        title: 'Wear an N95 Mask Outdoors',
        description: 'A well-fitted N95 mask filters fine particles effectively during travel.',
        icon: '😷',
      },
      homeVentilation: {
        status: 'Keep Windows Closed',
        title: 'Close Windows at Peak Hours',
        description: 'Keep doors and windows shut during morning and evening rush hours.',
        icon: '🚪',
      },
      sensitiveGroups: {
        status: 'Extra Care Advised',
        title: 'Sensitive Groups Rest Indoors',
        description: 'Children and elderly family members should limit extended outdoor playtime.',
        icon: '🏠',
      },
    };
  }

  if (pm25 <= 250) {
    return {
      outdoorExercise: {
        status: 'Indoor Exercise Preferred',
        title: 'Indoor Workouts Preferred',
        description: 'Air pollution is high today. Prefer indoor workouts to protect your respiratory system.',
        icon: '🧘',
      },
      masksProtection: {
        status: 'Strongly Recommended',
        title: 'Wear an N95 Mask for Travel',
        description: 'Wearing an N95 or particulate mask outdoors filters fine dust during travel.',
        icon: '😷',
      },
      homeVentilation: {
        status: 'Keep Windows Closed',
        title: 'Keep Windows Closed & Purify',
        description: 'Keep windows shut and run indoor HEPA air purifiers in bedrooms if available.',
        icon: '🛡️',
      },
      sensitiveGroups: {
        status: 'Extra Care Advised',
        title: 'Protect Vulnerable Family',
        description: 'Seniors, infants, and asthma patients should stay indoors in clean-air rooms.',
        icon: '❤️‍🩹',
      },
    };
  }

  // Severe (251+)
  return {
    outdoorExercise: {
      status: 'Indoor Exercise Preferred',
      title: 'Stay Indoors Where Possible',
      description: 'Heavy atmospheric particle levels outside. Keep physical exercise indoors today.',
      icon: '🏠',
    },
    masksProtection: {
      status: 'Strongly Recommended',
      title: 'Wear an N95 Mask for Commutes',
      description: 'Wear a sealed N95 respirator if travel is necessary; cloth masks do not filter fine particles.',
      icon: '😷',
    },
    homeVentilation: {
      status: 'Keep Windows Closed',
      title: 'Keep Living Spaces Enclosed',
      description: 'Keep windows and doors closed. Use indoor air purifiers to maintain a clean room.',
      icon: '🔒',
    },
    sensitiveGroups: {
      status: 'Extra Care Advised',
      title: 'High Care for Sensitive Groups',
      description: 'Vulnerable individuals should avoid outside exposure and keep prescriptions on hand.',
      icon: '🏥',
    },
  };
}

export interface DayWindowHighlight {
  bestWindow: {
    startHour: string;
    endHour: string;
    avgVal: number;
    category: AQICategory;
    tip: string;
  };
  peakWarning: {
    startHour: string;
    endHour: string;
    peakVal: number;
    category: AQICategory;
    reason: string;
  };
}

export function computeDailyWindowHighlights(
  actualOrPredicted24h: number[],
  baseTimestamp: string
): DayWindowHighlight {
  if (!actualOrPredicted24h || actualOrPredicted24h.length === 0) {
    return {
      bestWindow: {
        startHour: '2:00 PM',
        endHour: '4:00 PM',
        avgVal: 95,
        category: 'Poor',
        tip: 'Solar boundary layer mixing dilutes ground pollutants',
      },
      peakWarning: {
        startHour: '11:00 PM',
        endHour: '4:00 AM',
        peakVal: 240,
        category: 'Very Poor',
        reason: 'Cooling night temperatures trap vehicle exhaust near ground level',
      },
    };
  }

  const baseDate = new Date(baseTimestamp.replace(' ', 'T'));
  const hours = actualOrPredicted24h.map((val, i) => {
    const d = new Date(baseDate.getTime() + (i + 1) * 3600 * 1000);
    return { hour: d.getHours(), val, idx: i };
  });

  // Find lowest 3-consecutive-hour average
  let lowestAvg = Infinity;
  let bestIdx = 0;
  for (let i = 0; i <= hours.length - 3; i++) {
    const avg = (hours[i].val + hours[i + 1].val + hours[i + 2].val) / 3;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      bestIdx = i;
    }
  }

  // Find peak hour
  let peakVal = -Infinity;
  let peakIdx = 0;
  hours.forEach((h, i) => {
    if (h.val > peakVal) {
      peakVal = h.val;
      peakIdx = i;
    }
  });

  const formatHour = (hourNum: number) => {
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const h = hourNum % 12 || 12;
    return `${h}:00 ${ampm}`;
  };

  const bestStartHour = formatHour(hours[bestIdx].hour);
  const bestEndHour = formatHour((hours[bestIdx].hour + 3) % 24);
  const peakStartHour = formatHour(hours[Math.max(0, peakIdx - 1)].hour);
  const peakEndHour = formatHour((hours[Math.min(hours.length - 1, peakIdx + 2)].hour) % 24);

  return {
    bestWindow: {
      startHour: bestStartHour,
      endHour: bestEndHour,
      avgVal: Math.round(lowestAvg),
      category: getAQICategory(lowestAvg),
      tip: 'Warm daytime sunlight expands the atmospheric mixing layer, offering the cleanest breathing window.',
    },
    peakWarning: {
      startHour: peakStartHour,
      endHour: peakEndHour,
      peakVal: Math.round(peakVal),
      category: getAQICategory(peakVal),
      reason: 'Nocturnal thermal inversion creates a cold atmospheric lid, trapping vehicular and industrial smoke.',
    },
  };
}

export function describeWindMovement(angleDeg: number, speedKmh = 8.5): {
  directionText: string;
  sourceText: string;
  destinationText: string;
  impactNarrative: string;
} {
  // Normalize angle to 0-360
  const deg = ((angleDeg % 360) + 360) % 360;

  if (deg >= 292.5 && deg < 337.5) {
    return {
      directionText: 'North-West (NW)',
      sourceText: 'Punjab & Haryana Agricultural Plains',
      destinationText: 'Central & East Delhi (Anand Vihar, Patparganj)',
      impactNarrative:
        `A gentle ${speedKmh} km/h breeze from the North-West is sweeping regional smoke plumes through Rohini and Wazirpur toward Central and Trans-Yamuna neighborhoods. Downwind districts in East Delhi are likely to experience increased particle accumulation over the coming hours.`,
    };
  }

  if (deg >= 247.5 && deg < 292.5) {
    return {
      directionText: 'Westerly (W)',
      sourceText: 'Western NCR & Rajasthan Border',
      destinationText: 'Central Delhi & East NCT',
      impactNarrative:
        `Steady ${speedKmh} km/h westerly winds carry arid dust and suburban emissions straight across Mundka and Punjabi Bagh toward the city core.`,
    };
  }

  if (deg >= 202.5 && deg < 247.5) {
    return {
      directionText: 'South-West (SW)',
      sourceText: 'Gurugram & Southern Highway Corridors',
      destinationText: 'North and North-East Delhi',
      impactNarrative:
        `Winds blowing from the South-West at ${speedKmh} km/h channel vehicular traffic plumes from the NH-48 corridor into Central and North Delhi.`,
    };
  }

  if (deg >= 157.5 && deg < 202.5) {
    return {
      directionText: 'Southerly (S)',
      sourceText: 'Faridabad & Aravalli Ridges',
      destinationText: 'North NCT & Yamuna Floodplains',
      impactNarrative:
        `Southerly air currents at ${speedKmh} km/h push warm industrial emissions from Okhla and Faridabad northward along the Yamuna drainage basin.`,
    };
  }

  if (deg >= 112.5 && deg < 157.5) {
    return {
      directionText: 'South-East (SE)',
      sourceText: 'Noida & Uttar Pradesh Border',
      destinationText: 'North-West Delhi (Bawana, Narela)',
      impactNarrative:
        `Moist south-easterly breezes at ${speedKmh} km/h push cross-border industrial haze into Central and North-Western Delhi.`,
    };
  }

  if (deg >= 67.5 && deg < 112.5) {
    return {
      directionText: 'Easterly (E)',
      sourceText: 'Ghaziabad & Western UP Plains',
      destinationText: 'West Delhi & Airport Airshed',
      impactNarrative:
        `Easterly airflow at ${speedKmh} km/h brings stagnant trans-Yamuna moisture and smoke across the city toward Dwarka and Najafgarh.`,
    };
  }

  if (deg >= 22.5 && deg < 67.5) {
    return {
      directionText: 'North-East (NE)',
      sourceText: 'Upper Gangetic Basin',
      destinationText: 'South & South-West Delhi',
      impactNarrative:
        `North-easterly winds at ${speedKmh} km/h gently transport morning haze across Sonia Vihar and ITO toward South Delhi's residential colonies.`,
    };
  }

  // Northerly default
  return {
    directionText: 'Northerly (N)',
    sourceText: 'Northern Foothills & Alipur Air Corridor',
    destinationText: 'South Delhi & NCR Borders',
    impactNarrative:
      `Northerly breezes at ${speedKmh} km/h carry cooler air from the northern periphery through the center of Delhi toward the southern ridges.`,
  };
}

