import { Station, StationForecast, AQICategory } from '../types';
import { CPCB_CATEGORIES, getAQICategory } from './aqi';

export type DelhiZone = 'All' | 'North' | 'South' | 'East' | 'West' | 'Central';

export interface StationZoneMeta {
  zone: DelhiZone;
  areaType: string;
  landmark: string;
}

// Approximate grouping of the 37 monitoring stations into five Delhi areas (hand-written; not an official boundary)
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
  24: { zone: 'East', areaType: 'Transit hub (ISBT & railway)', landmark: 'Anand Vihar ISBT & Railway Terminal' },
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
} {
  // No time available: say so, never show a made-up date
  const unavailable = { formattedDate: 'Time not available', formattedTime: '' };
  if (!ts) return unavailable;

  const parts = ts.split(' ');
  const [year, month, day] = parts[0].split('-');
  const [hour, minute] = (parts[1] || '').split(':');
  const h = parseInt(hour, 10);
  const mIdx = parseInt(month, 10) - 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!year || !monthNames[mIdx] || !parseInt(day, 10) || isNaN(h) || minute === undefined) return unavailable;

  return {
    formattedDate: `${monthNames[mIdx]} ${parseInt(day, 10)}, ${year}`,
    formattedTime: `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`,
  };
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

export function describeWindMovement(angleDeg: number, speedKmh: number): {
  directionText: string;
  sourceText: string;
  destinationText: string;
  impactNarrative: string;
} {
  // Normalize angle to 0-360 (direction the wind blows FROM)
  const deg = ((angleDeg % 360) + 360) % 360;
  const kmh = Math.round(speedKmh);

  let sector = { directionText: 'Northerly (N)', sourceText: 'Northern Delhi borders', destinationText: 'South Delhi & the southern ridge' };
  if (deg >= 292.5 && deg < 337.5) sector = { directionText: 'North-West (NW)', sourceText: 'Punjab & Haryana plains', destinationText: 'Central & East Delhi (Anand Vihar, Patparganj)' };
  else if (deg >= 247.5 && deg < 292.5) sector = { directionText: 'Westerly (W)', sourceText: 'Western NCR & Rajasthan border', destinationText: 'Central Delhi & East Delhi' };
  else if (deg >= 202.5 && deg < 247.5) sector = { directionText: 'South-West (SW)', sourceText: 'Gurugram & the southern highway corridor', destinationText: 'North and North-East Delhi' };
  else if (deg >= 157.5 && deg < 202.5) sector = { directionText: 'Southerly (S)', sourceText: 'Faridabad & the Aravalli ridge', destinationText: 'North Delhi & the Yamuna floodplain' };
  else if (deg >= 112.5 && deg < 157.5) sector = { directionText: 'South-East (SE)', sourceText: 'Noida & the Uttar Pradesh border', destinationText: 'North-West Delhi (Bawana, Narela)' };
  else if (deg >= 67.5 && deg < 112.5) sector = { directionText: 'Easterly (E)', sourceText: 'Ghaziabad & western Uttar Pradesh', destinationText: 'West Delhi & the airport area' };
  else if (deg >= 22.5 && deg < 67.5) sector = { directionText: 'North-East (NE)', sourceText: 'North-East of Delhi', destinationText: 'South & South-West Delhi' };

  const word = kmh < 3.6 ? 'calm' : kmh < 12 ? 'light' : kmh < 20 ? 'gentle' : kmh < 30 ? 'moderate' : 'strong';
  const impactNarrative =
    kmh < 3.6
      ? `The air is almost still (${kmh} km/h), so there is little ventilation or transport; pollution tends to stay close to where it is produced.`
      : `A ${word} ${kmh} km/h wind is blowing from the ${
          { N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west' }[
            (sector.directionText.match(/\((\w+)\)/)?.[1] ?? 'N') as 'N'
          ]
        }, moving air from ${sector.sourceText} toward ${sector.destinationText}. Neighbourhoods on the downwind side may see particles drift their way over the coming hours.`;

  return { ...sector, impactNarrative };
}
