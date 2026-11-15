// Authoritative multi-city registry and station coordinates for EcoTwin
// Verified from CPCB CAAQMS network and OpenAQ records

export interface GeneralisationMetrics {
  zeroShotRmse?: number;
  fewShotRmse?: number;
  persistenceRmse?: number;
}

export interface CityMeta {
  id: string;
  name: string;
  state: string;
  stationCount: number;
  center: [number, number]; // [lon, lat]
  zoom: number;
  bounds: [[number, number], [number, number]]; // [[minLon, minLat], [maxLon, maxLat]]
  category: 'Primary Digital Twin' | 'Generalisation Evaluated' | 'CAAQMS Monitored' | 'Regional Airshed' | 'National Overview';
  description: string;
  generalisationMetrics?: GeneralisationMetrics;
}

export interface GeoStation {
  id: number;
  name: string;
  cityId: string;
  cityName: string;
  lat: number;
  lon: number;
  provider: string;
  isPrimaryTwin: boolean;
  medianPm25?: number;
  coverage?: number;
}

export const CITIES_DATA: CityMeta[] = [
  {
    "id": "all",
    "name": "All Cities (National Grid)",
    "state": "India",
    "center": [
      78.9629,
      22.5937
    ],
    "zoom": 4.8,
    "bounds": [
      [
        68.2,
        8.1
      ],
      [
        89.9,
        31.9
      ]
    ],
    "category": "National Overview",
    "description": "175 verified CAAQMS monitoring stations across 13 Indian metropolitan airsheds.",
    "stationCount": 175
  },
  {
    "id": "delhi",
    "name": "Delhi (NCT)",
    "state": "National Capital Territory",
    "center": [
      77.215,
      28.635
    ],
    "zoom": 10.3,
    "bounds": [
      [
        76.88,
        28.43
      ],
      [
        77.36,
        28.87
      ]
    ],
    "category": "Primary Digital Twin",
    "description": "37 continuous CAAQMS stations powering WA-TGCN 24h predictive digital twin & advection modeling.",
    "stationCount": 37
  },
  {
    "id": "mumbai",
    "name": "Mumbai",
    "state": "Maharashtra",
    "center": [
      72.877,
      19.076
    ],
    "zoom": 10.2,
    "bounds": [
      [
        72.78,
        18.94
      ],
      [
        73.18,
        19.34
      ]
    ],
    "category": "Generalisation Evaluated",
    "description": "Western coastal megacity airshed evaluated in cross-city transfer experiments.",
    "generalisationMetrics": {
      "zeroShotRmse": 28.9,
      "fewShotRmse": 26.2,
      "persistenceRmse": 33.13
    },
    "stationCount": 27
  },
  {
    "id": "kolkata",
    "name": "Kolkata",
    "state": "West Bengal",
    "center": [
      88.363,
      22.572
    ],
    "zoom": 11.0,
    "bounds": [
      [
        88.25,
        22.47
      ],
      [
        88.44,
        22.66
      ]
    ],
    "category": "Generalisation Evaluated",
    "description": "Eastern riverine Gangetic delta airshed with heavy winter particulate concentration.",
    "generalisationMetrics": {
      "zeroShotRmse": 31.22,
      "fewShotRmse": 30.92,
      "persistenceRmse": 44.6
    },
    "stationCount": 10
  },
  {
    "id": "ahmedabad",
    "name": "Ahmedabad",
    "state": "Gujarat",
    "center": [
      72.571,
      23.022
    ],
    "zoom": 11.2,
    "bounds": [
      [
        72.43,
        22.94
      ],
      [
        72.67,
        23.13
      ]
    ],
    "category": "Generalisation Evaluated",
    "description": "Western semi-arid industrial corridor evaluated under cross-city transfer.",
    "generalisationMetrics": {
      "zeroShotRmse": 29.16,
      "fewShotRmse": 26.03,
      "persistenceRmse": 35.67
    },
    "stationCount": 9
  },
  {
    "id": "patna",
    "name": "Patna",
    "state": "Bihar",
    "center": [
      85.137,
      25.594
    ],
    "zoom": 11.5,
    "bounds": [
      [
        85.02,
        25.56
      ],
      [
        85.27,
        25.72
      ]
    ],
    "category": "Generalisation Evaluated",
    "description": "Indo-Gangetic plain river valley with seasonal atmospheric inversion.",
    "generalisationMetrics": {
      "zeroShotRmse": 32.37,
      "fewShotRmse": 30.14,
      "persistenceRmse": 39.25
    },
    "stationCount": 6
  },
  {
    "id": "bengaluru",
    "name": "Bengaluru",
    "state": "Karnataka",
    "center": [
      77.594,
      12.971
    ],
    "zoom": 11.0,
    "bounds": [
      [
        77.47,
        12.89
      ],
      [
        77.65,
        13.05
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Southern Deccan plateau urban technological hub with 8 active monitoring stations.",
    "stationCount": 8
  },
  {
    "id": "hyderabad",
    "name": "Hyderabad",
    "state": "Telangana",
    "center": [
      78.486,
      17.385
    ],
    "zoom": 10.8,
    "bounds": [
      [
        78.25,
        17.32
      ],
      [
        78.59,
        17.57
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Central Deccan plateau urban corridor covering 12 continuous CAAQMS stations.",
    "stationCount": 12
  },
  {
    "id": "chennai",
    "name": "Chennai",
    "state": "Tamil Nadu",
    "center": [
      80.27,
      13.082
    ],
    "zoom": 11.0,
    "bounds": [
      [
        80.18,
        12.93
      ],
      [
        80.32,
        13.19
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Coromandel coastal metropolitan monitoring network spanning coastal breeze regimes.",
    "stationCount": 7
  },
  {
    "id": "jaipur",
    "name": "Jaipur",
    "state": "Rajasthan",
    "center": [
      75.787,
      26.912
    ],
    "zoom": 11.4,
    "bounds": [
      [
        75.7,
        26.76
      ],
      [
        75.86,
        26.99
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Semi-arid desert fringe airshed susceptible to mineral dust transport.",
    "stationCount": 6
  },
  {
    "id": "lucknow",
    "name": "Lucknow",
    "state": "Uttar Pradesh",
    "center": [
      80.946,
      26.846
    ],
    "zoom": 11.3,
    "bounds": [
      [
        80.86,
        26.74
      ],
      [
        81.03,
        26.93
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Central Gangetic basin urban network with severe winter stagnation.",
    "stationCount": 6
  },
  {
    "id": "pune",
    "name": "Pune",
    "state": "Maharashtra",
    "center": [
      73.856,
      18.52
    ],
    "zoom": 11.3,
    "bounds": [
      [
        73.75,
        18.48
      ],
      [
        73.95,
        18.64
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Western Ghats rain shadow valley urban monitoring basin.",
    "stationCount": 6
  },
  {
    "id": "kanpur",
    "name": "Kanpur",
    "state": "Uttar Pradesh",
    "center": [
      80.331,
      26.449
    ],
    "zoom": 11.6,
    "bounds": [
      [
        80.22,
        26.4
      ],
      [
        80.35,
        26.53
      ]
    ],
    "category": "CAAQMS Monitored",
    "description": "Heavy industrial manufacturing hub on the banks of the Ganges.",
    "stationCount": 3
  },
  {
    "id": "ncr",
    "name": "Delhi NCR (Surrounding)",
    "state": "Haryana / UP",
    "center": [
      77.2,
      28.45
    ],
    "zoom": 9.8,
    "bounds": [
      [
        76.88,
        28.28
      ],
      [
        77.52,
        28.68
      ]
    ],
    "category": "Regional Airshed",
    "description": "Surrounding National Capital Region airshed perimeter (Gurugram, Faridabad, Noida, Ghaziabad).",
    "stationCount": 37
  }
];

export const ALL_STATIONS_DATA: GeoStation[] = [
  {
    "id": 0,
    "name": "ITO",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.628624,
    "lon": 77.24106,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 1,
    "name": "Jahangirpuri",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.73282,
    "lon": 77.170633,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 2,
    "name": "Jawaharlal Nehru Stadium",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.58028,
    "lon": 77.233829,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 3,
    "name": "Major Dhyan Chand National Stadium",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.611281,
    "lon": 77.237738,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 4,
    "name": "Alipur",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.815329,
    "lon": 77.15301,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 5,
    "name": "Dwarka-Sector 8",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.571027,
    "lon": 77.071901,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 6,
    "name": "IGI Airport (T3)",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.562776,
    "lon": 77.118005,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 7,
    "name": "NSIT Dwarka",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.60909,
    "lon": 77.032541,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 8,
    "name": "Najafgarh",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.570173,
    "lon": 76.933762,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 9,
    "name": "Dr. Karni Singh Shooting Range",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.498571,
    "lon": 77.26484,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 10,
    "name": "Ashok Vihar",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.695381,
    "lon": 77.181665,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 11,
    "name": "Mundka",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.684678,
    "lon": 77.076574,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 12,
    "name": "Patparganj",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.623763,
    "lon": 77.287209,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 13,
    "name": "Punjabi Bagh",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.674045,
    "lon": 77.131023,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 14,
    "name": "Pusa DPCC",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.639652,
    "lon": 77.146275,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 15,
    "name": "Pusa IITM",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.63611,
    "lon": 77.173332,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 16,
    "name": "R K Puram",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.563262,
    "lon": 77.186937,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 17,
    "name": "Nehru Nagar",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.56789,
    "lon": 77.250515,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 18,
    "name": "North Campus",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.657381,
    "lon": 77.158545,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 19,
    "name": "Okhla Phase-2",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.530785,
    "lon": 77.271255,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 20,
    "name": "Sirifort",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.550425,
    "lon": 77.215938,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 21,
    "name": "Sonia Vihar",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.710508,
    "lon": 77.249485,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 22,
    "name": "Shadipur",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.651478,
    "lon": 77.147311,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 23,
    "name": "Sri Aurobindo Marg",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.531346,
    "lon": 77.190156,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 24,
    "name": "Anand Vihar",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.647622,
    "lon": 77.315809,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 25,
    "name": "DTU",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.75005,
    "lon": 77.111261,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 26,
    "name": "Lodhi Road",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.591825,
    "lon": 77.227307,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 27,
    "name": "Chandni Chowk",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.656756,
    "lon": 77.227234,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 28,
    "name": "Bawana",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.7762,
    "lon": 77.051074,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 29,
    "name": "Burari Crossing",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.72565,
    "lon": 77.201157,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 30,
    "name": "CRRI Mathura Road",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.551201,
    "lon": 77.273574,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 31,
    "name": "Narela",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.822836,
    "lon": 77.101981,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 32,
    "name": "Vivek Vihar",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.672342,
    "lon": 77.31526,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 33,
    "name": "Mandir Marg",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.636429,
    "lon": 77.201067,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 34,
    "name": "Rohini",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.732528,
    "lon": 77.11992,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 35,
    "name": "Aya Nagar",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.4707,
    "lon": 77.1099,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 36,
    "name": "Wazirpur",
    "cityId": "delhi",
    "cityName": "Delhi (NCT)",
    "lat": 28.6998,
    "lon": 77.1652,
    "provider": "CPCB / DPCC",
    "isPrimaryTwin": true
  },
  {
    "id": 228300,
    "name": "SAC ISRO Satellite, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.023389,
    "lon": 72.515201,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 47.5,
    "coverage": 0.915
  },
  {
    "id": 228303,
    "name": "SAC ISRO Bopal, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.041137,
    "lon": 72.456691,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 79.6,
    "coverage": 0.914
  },
  {
    "id": 227534,
    "name": "Gyaspur, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 22.977134,
    "lon": 72.553024,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 69.1,
    "coverage": 0.908
  },
  {
    "id": 228297,
    "name": "SVPI Airport Hansol, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.076793,
    "lon": 72.627874,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 41.0,
    "coverage": 0.908
  },
  {
    "id": 227533,
    "name": "Rakhial, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.016834,
    "lon": 72.625775,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 54.5,
    "coverage": 0.901
  },
  {
    "id": 5631,
    "name": "Maninagar, Ahmedabad - GPCB",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.002657,
    "lon": 72.591912,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 58.7,
    "coverage": 0.891
  },
  {
    "id": 301387,
    "name": "Raikhad, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.020509,
    "lon": 72.579261,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 62.9,
    "coverage": 0.877
  },
  {
    "id": 6942,
    "name": "Phase-4 GIDC, Vatva - GPCB",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 22.969611,
    "lon": 72.6435,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 67.8,
    "coverage": 0.869
  },
  {
    "id": 227536,
    "name": "Chandkheda, Ahmedabad - IITM",
    "cityId": "ahmedabad",
    "cityName": "Ahmedabad",
    "lat": 23.107969,
    "lon": 72.574648,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 47.6,
    "coverage": 0.857
  },
  {
    "id": 6983,
    "name": "Hombegowda Nagar, Bengaluru - KSPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 12.938539,
    "lon": 77.5901,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 32.0,
    "coverage": 0.889
  },
  {
    "id": 6984,
    "name": "Hebbal, Bengaluru - KSPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 13.029152,
    "lon": 77.585901,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 51.0,
    "coverage": 0.885
  },
  {
    "id": 6973,
    "name": "Jayanagar 5th Block, Bengaluru - KSPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 12.920984,
    "lon": 77.584908,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 49.0,
    "coverage": 0.882
  },
  {
    "id": 6975,
    "name": "Silk Board, Bengaluru - KSPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 12.917348,
    "lon": 77.622813,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 49.0,
    "coverage": 0.869
  },
  {
    "id": 3409385,
    "name": "RVCE-Mailasandra, Bengaluru - KSPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 12.921418,
    "lon": 77.502466,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 57.4,
    "coverage": 0.836
  },
  {
    "id": 5607,
    "name": "Peenya, Bengaluru - CPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 13.02702,
    "lon": 77.494094,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 19.0,
    "coverage": 0.829
  },
  {
    "id": 5548,
    "name": "BTM Layout, Bengaluru - CPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 12.913522,
    "lon": 77.59508,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 53.2,
    "coverage": 0.825
  },
  {
    "id": 3409393,
    "name": "Shivapura_Peenya, Bengaluru - KSPCB",
    "cityId": "bengaluru",
    "cityName": "Bengaluru",
    "lat": 13.024634,
    "lon": 77.508011,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 45.5,
    "coverage": 0.74
  },
  {
    "id": 12046,
    "name": "Perungudi, Chennai - TNPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 12.9533,
    "lon": 80.2357,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 55.0,
    "coverage": 0.903
  },
  {
    "id": 11581,
    "name": "Arumbakkam, Chennai - TNPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 13.0664,
    "lon": 80.2112,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 60.0,
    "coverage": 0.9
  },
  {
    "id": 11579,
    "name": "Kodungaiyur, Chennai - TNPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 13.1278,
    "lon": 80.2642,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 67.0,
    "coverage": 0.889
  },
  {
    "id": 5655,
    "name": "Velachery Res. Area, Chennai - CPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 13.005219,
    "lon": 80.239812,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 31.0,
    "coverage": 0.87
  },
  {
    "id": 10780,
    "name": "Manali Village, Chennai - TNPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 13.1662,
    "lon": 80.2584,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 52.2,
    "coverage": 0.863
  },
  {
    "id": 2586,
    "name": "Manali, Chennai - CPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 13.164544,
    "lon": 80.26285,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 57.8,
    "coverage": 0.859
  },
  {
    "id": 11578,
    "name": "Royapuram, Chennai - TNPCB",
    "cityId": "chennai",
    "cityName": "Chennai",
    "lat": 13.1036,
    "lon": 80.2909,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 39.0,
    "coverage": 0.845
  },
  {
    "id": 8118,
    "name": "New Delhi",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.63576,
    "lon": 77.22445,
    "provider": "AirNow",
    "isPrimaryTwin": false,
    "medianPm25": 134.0,
    "coverage": 0.994
  },
  {
    "id": 5586,
    "name": "Sirifort, Delhi - CPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.550425,
    "lon": 77.215938,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 141.0,
    "coverage": 0.917
  },
  {
    "id": 6929,
    "name": "Major Dhyan Chand National Stadium, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.611281,
    "lon": 77.237738,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 117.0,
    "coverage": 0.915
  },
  {
    "id": 6988,
    "name": "Sector-116, Noida - UPPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.56923,
    "lon": 77.393848,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 139.0,
    "coverage": 0.915
  },
  {
    "id": 6931,
    "name": "Dwarka-Sector 8, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.571027,
    "lon": 77.071901,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 145.0,
    "coverage": 0.914
  },
  {
    "id": 6960,
    "name": "Patparganj, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.623748,
    "lon": 77.287205,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 143.0,
    "coverage": 0.913
  },
  {
    "id": 8365,
    "name": "Nehru Nagar, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.56789,
    "lon": 77.250515,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 167.0,
    "coverage": 0.913
  },
  {
    "id": 6934,
    "name": "Dr. Karni Singh Shooting Range, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.498571,
    "lon": 77.26484,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 135.0,
    "coverage": 0.911
  },
  {
    "id": 6957,
    "name": "Jawaharlal Nehru Stadium, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.58028,
    "lon": 77.233829,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 135.0,
    "coverage": 0.911
  },
  {
    "id": 6924,
    "name": "Indirapuram, Ghaziabad - UPPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.646233,
    "lon": 77.358075,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 133.0,
    "coverage": 0.91
  },
  {
    "id": 10920,
    "name": "New Industrial Town, Faridabad - HSPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.39072,
    "lon": 77.30059,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 90.4,
    "coverage": 0.91
  },
  {
    "id": 5627,
    "name": "CRRI Mathura Road, New Delhi - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.551201,
    "lon": 77.273574,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 111.8,
    "coverage": 0.909
  },
  {
    "id": 6356,
    "name": "Pusa, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.639645,
    "lon": 77.146262,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 141.0,
    "coverage": 0.909
  },
  {
    "id": 5616,
    "name": "Sector - 62, Noida, UP - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.624548,
    "lon": 77.35771,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 110.4,
    "coverage": 0.908
  },
  {
    "id": 5613,
    "name": "ITO, New Delhi - CPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.628624,
    "lon": 77.24106,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 135.0,
    "coverage": 0.907
  },
  {
    "id": 100235,
    "name": "Anand Vihar, New Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.646835,
    "lon": 77.316032,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 175.0,
    "coverage": 0.905
  },
  {
    "id": 5634,
    "name": "Lodhi Road, New Delhi - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.591825,
    "lon": 77.227307,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 88.5,
    "coverage": 0.9
  },
  {
    "id": 100017,
    "name": "R K Puram, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.563262,
    "lon": 77.186937,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 152.0,
    "coverage": 0.898
  },
  {
    "id": 8239,
    "name": "Okhla Phase-2, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.530785,
    "lon": 77.271255,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 139.0,
    "coverage": 0.897
  },
  {
    "id": 10488,
    "name": "Najafgarh, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.570173,
    "lon": 76.933762,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 99.0,
    "coverage": 0.897
  },
  {
    "id": 5570,
    "name": "Aya Nagar, New Delhi - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.474261,
    "lon": 77.131606,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 95.5,
    "coverage": 0.896
  },
  {
    "id": 5622,
    "name": "NSIT Dwarka, Delhi - CPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.60909,
    "lon": 77.032541,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 92.4,
    "coverage": 0.896
  },
  {
    "id": 5650,
    "name": "IGI Airport (T3), Delhi - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.562776,
    "lon": 77.118005,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 94.3,
    "coverage": 0.894
  },
  {
    "id": 10484,
    "name": "Sri Aurobindo Marg, Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.531346,
    "lon": 77.190156,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 96.0,
    "coverage": 0.893
  },
  {
    "id": 6972,
    "name": "Nathu Colony, Ballabgarh - HSPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.341925,
    "lon": 77.319699,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 112.5,
    "coverage": 0.893
  },
  {
    "id": 6986,
    "name": "Knowledge Park - V, Greater Noida - UPPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.557054,
    "lon": 77.453663,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 150.0,
    "coverage": 0.892
  },
  {
    "id": 10921,
    "name": "NISE Gwal Pahari, Gurugram - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.422681,
    "lon": 77.148944,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 106.0,
    "coverage": 0.89
  },
  {
    "id": 10825,
    "name": "Sector-51, Gurugram - HSPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.4227,
    "lon": 77.0667,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 132.1,
    "coverage": 0.881
  },
  {
    "id": 6978,
    "name": "Knowledge Park - III, Greater Noida - UPPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.47272,
    "lon": 77.482,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 108.0,
    "coverage": 0.873
  },
  {
    "id": 6953,
    "name": "Sector-2 IMT, Manesar - HSPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.360699,
    "lon": 76.93609,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 99.4,
    "coverage": 0.871
  },
  {
    "id": 5598,
    "name": "Sector - 125, Noida, UP - UPPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.544761,
    "lon": 77.323126,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 147.0,
    "coverage": 0.852
  },
  {
    "id": 6358,
    "name": "Mandir Marg, New Delhi - DPCC",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.636429,
    "lon": 77.201067,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 99.0,
    "coverage": 0.85
  },
  {
    "id": 10908,
    "name": "Sector 11, Faridabad - HSPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.376058,
    "lon": 77.315741,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 114.6,
    "coverage": 0.849
  },
  {
    "id": 3410004,
    "name": "Amity University, Panchgaon - IITM",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.3153,
    "lon": 76.9143,
    "provider": "N/A",
    "isPrimaryTwin": false,
    "medianPm25": 60.9,
    "coverage": 0.841
  },
  {
    "id": 5404,
    "name": "Pusa, Delhi - IMD",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.639645,
    "lon": 77.146263,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 100.7,
    "coverage": 0.839
  },
  {
    "id": 6980,
    "name": "Sector-1, Noida - UPPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.589247,
    "lon": 77.321962,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 135.0,
    "coverage": 0.817
  },
  {
    "id": 100301,
    "name": "Vikas Sadan, Gurugram - HSPCB",
    "cityId": "ncr",
    "cityName": "Delhi NCR (Surrounding)",
    "lat": 28.450124,
    "lon": 77.026305,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 128.4,
    "coverage": 0.797
  },
  {
    "id": 8557,
    "name": "Hyderabad",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.38405,
    "lon": 78.45636,
    "provider": "AirNow",
    "isPrimaryTwin": false,
    "medianPm25": 87.0,
    "coverage": 1.0
  },
  {
    "id": 344140,
    "name": "Somajiguda, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.417094,
    "lon": 78.457437,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 39.5,
    "coverage": 0.916
  },
  {
    "id": 346257,
    "name": "Ramachandrapuram, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.528544,
    "lon": 78.286195,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 27.2,
    "coverage": 0.913
  },
  {
    "id": 100407,
    "name": "Zoo Park, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.349694,
    "lon": 78.451437,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 59.0,
    "coverage": 0.912
  },
  {
    "id": 352465,
    "name": "New Malakpet, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.37206,
    "lon": 78.50864,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 33.5,
    "coverage": 0.876
  },
  {
    "id": 344104,
    "name": "Kompally Municipal Office, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.544899,
    "lon": 78.486949,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 31.1,
    "coverage": 0.862
  },
  {
    "id": 5623,
    "name": "Central University, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.460103,
    "lon": 78.334361,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 41.0,
    "coverage": 0.861
  },
  {
    "id": 344103,
    "name": "ECIL Kapra, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.470431,
    "lon": 78.566959,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 30.0,
    "coverage": 0.849
  },
  {
    "id": 5647,
    "name": "Sanathnagar, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.455946,
    "lon": 78.433215,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 42.0,
    "coverage": 0.841
  },
  {
    "id": 5645,
    "name": "ICRISAT Patancheru, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.5184,
    "lon": 78.278777,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 55.0,
    "coverage": 0.837
  },
  {
    "id": 346258,
    "name": "Kokapet, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.393559,
    "lon": 78.339194,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 35.8,
    "coverage": 0.824
  },
  {
    "id": 344142,
    "name": "Nacharam_TSIIC IALA, Hyderabad - TSPCB",
    "cityId": "hyderabad",
    "cityName": "Hyderabad",
    "lat": 17.429398,
    "lon": 78.569354,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 33.9,
    "coverage": 0.81
  },
  {
    "id": 5633,
    "name": "Police Commissionerate, Jaipur - RSPCB",
    "cityId": "jaipur",
    "cityName": "Jaipur",
    "lat": 26.916409,
    "lon": 75.79949,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 54.7,
    "coverage": 0.917
  },
  {
    "id": 3409430,
    "name": "Mansarovar Sector-12, Jaipur - RSPCB",
    "cityId": "jaipur",
    "cityName": "Jaipur",
    "lat": 26.843698,
    "lon": 75.766894,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 63.0,
    "coverage": 0.913
  },
  {
    "id": 5635,
    "name": "Adarsh Nagar, Jaipur - RSPCB",
    "cityId": "jaipur",
    "cityName": "Jaipur",
    "lat": 26.902909,
    "lon": 75.836858,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 67.2,
    "coverage": 0.907
  },
  {
    "id": 3409433,
    "name": "RIICO Sitapura, Jaipur - RSPCB",
    "cityId": "jaipur",
    "cityName": "Jaipur",
    "lat": 26.786682,
    "lon": 75.827928,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 72.0,
    "coverage": 0.895
  },
  {
    "id": 3409432,
    "name": "Sector-2 Murlipura, Jaipur - RSPCB",
    "cityId": "jaipur",
    "cityName": "Jaipur",
    "lat": 26.960669,
    "lon": 75.771817,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 53.0,
    "coverage": 0.88
  },
  {
    "id": 5612,
    "name": "Shastri Nagar, Jaipur - RSPCB",
    "cityId": "jaipur",
    "cityName": "Jaipur",
    "lat": 26.950293,
    "lon": 75.730943,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 64.9,
    "coverage": 0.867
  },
  {
    "id": 229252,
    "name": "NSI Kalyanpur, Kanpur - UPPCB",
    "cityId": "kanpur",
    "cityName": "Kanpur",
    "lat": 26.509954,
    "lon": 80.249612,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 46.9,
    "coverage": 0.893
  },
  {
    "id": 234568,
    "name": "FTI Kidwai Nagar, Kanpur - UPPCB",
    "cityId": "kanpur",
    "cityName": "Kanpur",
    "lat": 26.428282,
    "lon": 80.327067,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 50.5,
    "coverage": 0.886
  },
  {
    "id": 5662,
    "name": "Nehru Nagar, Kanpur - UPPCB",
    "cityId": "kanpur",
    "cityName": "Kanpur",
    "lat": 26.470314,
    "lon": 80.322986,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 56.0,
    "coverage": 0.839
  },
  {
    "id": 10844,
    "name": "Ghusuri, Howrah - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.611968,
    "lon": 88.347422,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 105.5,
    "coverage": 0.92
  },
  {
    "id": 6946,
    "name": "Belur Math, Howrah - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.629801,
    "lon": 88.352017,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 94.3,
    "coverage": 0.919
  },
  {
    "id": 10904,
    "name": "Rabindra Sarobar, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.51106,
    "lon": 88.35142,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 57.0,
    "coverage": 0.913
  },
  {
    "id": 3409320,
    "name": "Rabindra Bharati University, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.627875,
    "lon": 88.3804,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 79.3,
    "coverage": 0.91
  },
  {
    "id": 5614,
    "name": "Padmapukur, Howrah - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.568732,
    "lon": 88.279728,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 79.6,
    "coverage": 0.909
  },
  {
    "id": 10918,
    "name": "Ballygunge, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.536751,
    "lon": 88.363802,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 79.6,
    "coverage": 0.909
  },
  {
    "id": 10633,
    "name": "Victoria, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.544808,
    "lon": 88.340369,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 86.9,
    "coverage": 0.906
  },
  {
    "id": 6950,
    "name": "Jadavpur, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.49929,
    "lon": 88.36917,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 96.6,
    "coverage": 0.901
  },
  {
    "id": 6981,
    "name": "Fort William, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.55664,
    "lon": 88.342674,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 64.7,
    "coverage": 0.879
  },
  {
    "id": 10851,
    "name": "Bidhannagar, Kolkata - WBPCB",
    "cityId": "kolkata",
    "cityName": "Kolkata",
    "lat": 22.58157,
    "lon": 88.410025,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 74.9,
    "coverage": 0.841
  },
  {
    "id": 5659,
    "name": "Lalbagh, Lucknow - CPCB",
    "cityId": "lucknow",
    "cityName": "Lucknow",
    "lat": 26.84588,
    "lon": 80.936554,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 74.9,
    "coverage": 0.916
  },
  {
    "id": 229404,
    "name": "Kukrail Picnic Spot-1, Lucknow - UPPCB",
    "cityId": "lucknow",
    "cityName": "Lucknow",
    "lat": 26.90723,
    "lon": 80.98579,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 29.5,
    "coverage": 0.915
  },
  {
    "id": 2456,
    "name": "Talkatora District Industries Center, Lucknow - CPCB",
    "cityId": "lucknow",
    "cityName": "Lucknow",
    "lat": 26.833997,
    "lon": 80.891736,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 89.4,
    "coverage": 0.907
  },
  {
    "id": 7140,
    "name": "Gomti Nagar, Lucknow - UPPCB",
    "cityId": "lucknow",
    "cityName": "Lucknow",
    "lat": 26.86812,
    "lon": 81.005119,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 65.0,
    "coverage": 0.898
  },
  {
    "id": 3409318,
    "name": "Central School, Lucknow - CPCB",
    "cityId": "lucknow",
    "cityName": "Lucknow",
    "lat": 26.8821,
    "lon": 80.930275,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 79.6,
    "coverage": 0.873
  },
  {
    "id": 227386,
    "name": "B R Ambedkar University, Lucknow - UPPCB",
    "cityId": "lucknow",
    "cityName": "Lucknow",
    "lat": 26.766433,
    "lon": 80.927299,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 45.5,
    "coverage": 0.857
  },
  {
    "id": 3409485,
    "name": "Gokul Nagar, Bhiwandi - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.309073,
    "lon": 73.057223,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 61.9,
    "coverage": 0.914
  },
  {
    "id": 11606,
    "name": "Borivali East, Mumbai - IITM",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.23241,
    "lon": 72.86895,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 45.5,
    "coverage": 0.911
  },
  {
    "id": 12024,
    "name": "Chakala-Andheri East, Mumbai - IITM",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.11074,
    "lon": 72.86084,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 61.8,
    "coverage": 0.91
  },
  {
    "id": 3409475,
    "name": "Tondare-Taloja, Navi Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.063,
    "lon": 73.1209,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 60.1,
    "coverage": 0.909
  },
  {
    "id": 3409472,
    "name": "Upvan Fort, Thane - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.222279,
    "lon": 72.957979,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 43.0,
    "coverage": 0.906
  },
  {
    "id": 3409476,
    "name": "CBD Belapur, Belapur - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.02439,
    "lon": 73.040672,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 44.7,
    "coverage": 0.901
  },
  {
    "id": 3409486,
    "name": "Kherwadi_Bandra East, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.063214,
    "lon": 72.845632,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 57.0,
    "coverage": 0.893
  },
  {
    "id": 11611,
    "name": "Malad West, Mumbai - IITM",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.19709,
    "lon": 72.82204,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 47.1,
    "coverage": 0.893
  },
  {
    "id": 3409469,
    "name": "Kasarvadavali, Thane - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.26777,
    "lon": 72.97182,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 39.7,
    "coverage": 0.885
  },
  {
    "id": 3409477,
    "name": "Kopripada-Vashi, Navi Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.090337,
    "lon": 73.014232,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 44.1,
    "coverage": 0.882
  },
  {
    "id": 3409479,
    "name": "Mindspace-Malad West, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.187866,
    "lon": 72.830407,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 51.6,
    "coverage": 0.877
  },
  {
    "id": 3409514,
    "name": "Ghatkopar, Mumbai - BMC",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.083694,
    "lon": 72.920967,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 48.7,
    "coverage": 0.876
  },
  {
    "id": 3409478,
    "name": "Bhayandar West, Mira-Bhayandar - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.296481,
    "lon": 72.840923,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 50.1,
    "coverage": 0.869
  },
  {
    "id": 3409482,
    "name": "Bandra Kurla Complex, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.065931,
    "lon": 72.862131,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 56.4,
    "coverage": 0.869
  },
  {
    "id": 3409329,
    "name": "Deonar, Mumbai - IITM",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.04946,
    "lon": 72.923,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 56.8,
    "coverage": 0.868
  },
  {
    "id": 6943,
    "name": "Mahape, Navi Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.113505,
    "lon": 73.008978,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 38.8,
    "coverage": 0.864
  },
  {
    "id": 3409483,
    "name": "Chembur, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.036458,
    "lon": 72.895437,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 48.7,
    "coverage": 0.846
  },
  {
    "id": 3409511,
    "name": "Shivaji Nagar, Mumbai - BMC",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.060498,
    "lon": 72.923356,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 45.3,
    "coverage": 0.846
  },
  {
    "id": 6965,
    "name": "Borivali East, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.227474,
    "lon": 72.864394,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 30.8,
    "coverage": 0.841
  },
  {
    "id": 6967,
    "name": "Sion, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.047,
    "lon": 72.8746,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 35.1,
    "coverage": 0.828
  },
  {
    "id": 7752,
    "name": "Khadakpada, Kalyan - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.25292,
    "lon": 73.142019,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 43.4,
    "coverage": 0.828
  },
  {
    "id": 3409471,
    "name": "Sector-2E Kalamboli, Navi Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.02579,
    "lon": 73.10297,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 44.6,
    "coverage": 0.828
  },
  {
    "id": 12040,
    "name": "Mulund West, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.175,
    "lon": 72.9419,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 41.9,
    "coverage": 0.821
  },
  {
    "id": 6956,
    "name": "Powai, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.1375,
    "lon": 72.915056,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 55.5,
    "coverage": 0.817
  },
  {
    "id": 6959,
    "name": "Siddharth Nagar-Worli, Mumbai - IITM",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.000083,
    "lon": 72.813993,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 60.1,
    "coverage": 0.8
  },
  {
    "id": 3409510,
    "name": "Byculla, Mumbai - BMC",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 18.9767,
    "lon": 72.838,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 52.1,
    "coverage": 0.745
  },
  {
    "id": 6987,
    "name": "Vile Parle West, Mumbai - MPCB",
    "cityId": "mumbai",
    "cityName": "Mumbai",
    "lat": 19.10861,
    "lon": 72.83622,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 46.8,
    "coverage": 0.736
  },
  {
    "id": 10599,
    "name": "Rajbansi Nagar, Patna - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.599486,
    "lon": 85.113666,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 55.4,
    "coverage": 0.906
  },
  {
    "id": 10630,
    "name": "Govt. High School Shikarpur, Patna - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.592539,
    "lon": 85.227158,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 56.4,
    "coverage": 0.887
  },
  {
    "id": 10645,
    "name": "Industrial Area, Hajipur - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.697189,
    "lon": 85.2459,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 82.4,
    "coverage": 0.867
  },
  {
    "id": 10670,
    "name": "Muradpur, Patna - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.619651,
    "lon": 85.147382,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 61.2,
    "coverage": 0.863
  },
  {
    "id": 7495,
    "name": "DRM Office Danapur, Patna - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.586562,
    "lon": 85.043586,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 65.5,
    "coverage": 0.854
  },
  {
    "id": 10697,
    "name": "Samanpura, Patna - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.596727,
    "lon": 85.085624,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 53.7,
    "coverage": 0.833
  },
  {
    "id": 5652,
    "name": "IGSC Planetarium Complex, Patna - BSPCB",
    "cityId": "patna",
    "cityName": "Patna",
    "lat": 25.5941,
    "lon": 85.1376,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 66.0,
    "coverage": 0.744
  },
  {
    "id": 3409526,
    "name": "Panchawati_Pashan, Pune - IITM",
    "cityId": "pune",
    "cityName": "Pune",
    "lat": 18.536457,
    "lon": 73.805454,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 62.9,
    "coverage": 0.917
  },
  {
    "id": 11609,
    "name": "Mhada Colony, Pune - IITM",
    "cityId": "pune",
    "cityName": "Pune",
    "lat": 18.57304,
    "lon": 73.927715,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 97.9,
    "coverage": 0.897
  },
  {
    "id": 3409528,
    "name": "Savta Mali Nagar, Pimpri-Chinchwad - IITM",
    "cityId": "pune",
    "cityName": "Pune",
    "lat": 18.614767,
    "lon": 73.799516,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 71.8,
    "coverage": 0.877
  },
  {
    "id": 11613,
    "name": "Revenue Colony-Shivajinagar, Pune - IITM",
    "cityId": "pune",
    "cityName": "Pune",
    "lat": 18.530085,
    "lon": 73.849598,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 74.0,
    "coverage": 0.875
  },
  {
    "id": 60658,
    "name": "Hadapsar, Pune - IITM",
    "cityId": "pune",
    "cityName": "Pune",
    "lat": 18.501793,
    "lon": 73.927532,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 117.3,
    "coverage": 0.855
  },
  {
    "id": 3409436,
    "name": "Park Street Wakad, Pimpri Chinchwad - MPCB",
    "cityId": "pune",
    "cityName": "Pune",
    "lat": 18.59051,
    "lon": 73.77946,
    "provider": "CPCB",
    "isPrimaryTwin": false,
    "medianPm25": 60.5,
    "coverage": 0.841
  }
];

export function getAllCities(): CityMeta[] {
  return CITIES_DATA;
}

export function getCityById(id: string): CityMeta {
  return CITIES_DATA.find((c) => c.id === id) || CITIES_DATA[1]; // default to Delhi
}

export function getStationsForCity(cityId: string): GeoStation[] {
  if (cityId === 'all') return ALL_STATIONS_DATA;
  return ALL_STATIONS_DATA.filter((s) => s.cityId === cityId);
}

export function getAllStations(): GeoStation[] {
  return ALL_STATIONS_DATA;
}

export function getStationById(id: number): GeoStation | undefined {
  return ALL_STATIONS_DATA.find((s) => s.id === id);
}
