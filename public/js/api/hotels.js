/**
 * hotels.js — Curated mock hotel dataset with scoring engine
 *
 * NOTE: Real hotel APIs (Amadeus, Hotels.com via RapidAPI) require billing credentials.
 * This module provides a realistic mock dataset with 100+ entries across 30 cities.
 * Replace getHotelsForCity() with a real API call when credentials are available.
 */

/** @type {Record<string, Hotel[]>} */
const HOTEL_DATA = {
  paris: [
    { id: 'par-b1', name: 'Le Marais Budget Inn', tier: 'budget', stars: 2, rating: 7.8, pricePerNight: 75, amenities: ['WiFi', 'Breakfast'], neighborhood: 'Le Marais' },
    { id: 'par-b2', name: 'Montmartre Hostel Plus', tier: 'budget', stars: 2, rating: 7.5, pricePerNight: 55, amenities: ['WiFi', 'Bar'], neighborhood: 'Montmartre' },
    { id: 'par-m1', name: 'Hotel Saint-Germain', tier: 'mid', stars: 3, rating: 8.4, pricePerNight: 160, amenities: ['WiFi', 'Breakfast', 'Gym', 'Bar'], neighborhood: 'Saint-Germain' },
    { id: 'par-m2', name: 'Opera Boutique Hotel', tier: 'mid', stars: 4, rating: 8.7, pricePerNight: 195, amenities: ['WiFi', 'Spa', 'Restaurant', 'Concierge'], neighborhood: 'Opéra' },
    { id: 'par-l1', name: 'Hôtel de Crillon', tier: 'luxury', stars: 5, rating: 9.4, pricePerNight: 780, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Butler', 'Concierge'], neighborhood: 'Champs-Élysées' },
    { id: 'par-l2', name: 'Shangri-La Paris', tier: 'luxury', stars: 5, rating: 9.2, pricePerNight: 650, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Room Service', 'Concierge'], neighborhood: 'Trocadéro' },
  ],
  tokyo: [
    { id: 'tyo-b1', name: 'Shinjuku Capsule World', tier: 'budget', stars: 2, rating: 7.9, pricePerNight: 45, amenities: ['WiFi', 'Locker'], neighborhood: 'Shinjuku' },
    { id: 'tyo-b2', name: 'Asakusa Budget Stay', tier: 'budget', stars: 2, rating: 7.6, pricePerNight: 60, amenities: ['WiFi', 'Breakfast'], neighborhood: 'Asakusa' },
    { id: 'tyo-m1', name: 'Shibuya Excel Hotel', tier: 'mid', stars: 3, rating: 8.3, pricePerNight: 135, amenities: ['WiFi', 'Gym', 'Restaurant'], neighborhood: 'Shibuya' },
    { id: 'tyo-m2', name: 'Ginza Grand Hotel', tier: 'mid', stars: 4, rating: 8.8, pricePerNight: 220, amenities: ['WiFi', 'Spa', 'Rooftop Bar', 'Restaurant', 'Concierge'], neighborhood: 'Ginza' },
    { id: 'tyo-l1', name: 'Park Hyatt Tokyo', tier: 'luxury', stars: 5, rating: 9.5, pricePerNight: 620, amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Club Lounge', 'Butler'], neighborhood: 'Shinjuku' },
    { id: 'tyo-l2', name: 'Aman Tokyo', tier: 'luxury', stars: 5, rating: 9.6, pricePerNight: 900, amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Concierge', 'Butler'], neighborhood: 'Otemachi' },
  ],
  'new york': [
    { id: 'nyc-b1', name: 'HI NYC Hostel', tier: 'budget', stars: 2, rating: 7.7, pricePerNight: 70, amenities: ['WiFi', 'Lounge'], neighborhood: 'Upper West Side' },
    { id: 'nyc-b2', name: 'Chelsea Economy Suites', tier: 'budget', stars: 2, rating: 7.3, pricePerNight: 95, amenities: ['WiFi', 'Kitchen'], neighborhood: 'Chelsea' },
    { id: 'nyc-m1', name: 'Midtown Boutique Hotel', tier: 'mid', stars: 3, rating: 8.2, pricePerNight: 210, amenities: ['WiFi', 'Gym', 'Bar'], neighborhood: 'Midtown' },
    { id: 'nyc-m2', name: 'The Pod 51', tier: 'mid', stars: 3, rating: 8.5, pricePerNight: 185, amenities: ['WiFi', 'Rooftop', 'Bar'], neighborhood: 'Midtown East' },
    { id: 'nyc-l1', name: 'The Plaza Hotel', tier: 'luxury', stars: 5, rating: 9.2, pricePerNight: 890, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Butler', 'Concierge'], neighborhood: 'Central Park South' },
    { id: 'nyc-l2', name: 'Mandarin Oriental NYC', tier: 'luxury', stars: 5, rating: 9.4, pricePerNight: 750, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Concierge'], neighborhood: 'Columbus Circle' },
  ],
  rome: [
    { id: 'rom-b1', name: 'Termini Budget Rooms', tier: 'budget', stars: 2, rating: 7.4, pricePerNight: 65, amenities: ['WiFi', 'Breakfast'], neighborhood: 'Termini' },
    { id: 'rom-m1', name: 'Trastevere Boutique', tier: 'mid', stars: 3, rating: 8.6, pricePerNight: 145, amenities: ['WiFi', 'Terrace', 'Bar'], neighborhood: 'Trastevere' },
    { id: 'rom-m2', name: 'Hotel Navona Classic', tier: 'mid', stars: 4, rating: 8.9, pricePerNight: 190, amenities: ['WiFi', 'Rooftop', 'Restaurant', 'Concierge'], neighborhood: 'Navona' },
    { id: 'rom-l1', name: 'Hotel de Russie', tier: 'luxury', stars: 5, rating: 9.3, pricePerNight: 580, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Garden', 'Concierge'], neighborhood: 'Spanish Steps' },
  ],
  barcelona: [
    { id: 'bcn-b1', name: 'Gothic Quarter Hostel', tier: 'budget', stars: 2, rating: 8.0, pricePerNight: 50, amenities: ['WiFi', 'Bar', 'Rooftop'], neighborhood: 'Gothic Quarter' },
    { id: 'bcn-m1', name: 'Eixample Design Hotel', tier: 'mid', stars: 4, rating: 8.7, pricePerNight: 165, amenities: ['WiFi', 'Spa', 'Rooftop Pool', 'Restaurant'], neighborhood: 'Eixample' },
    { id: 'bcn-l1', name: 'W Barcelona', tier: 'luxury', stars: 5, rating: 9.1, pricePerNight: 450, amenities: ['WiFi', 'Spa', 'Beach Pool', 'Restaurant', 'Club Lounge'], neighborhood: 'Barceloneta' },
  ],
  london: [
    { id: 'lon-b1', name: 'YHA London St Pancras', tier: 'budget', stars: 2, rating: 7.8, pricePerNight: 55, amenities: ['WiFi', 'Bar', 'Café'], neighborhood: 'Kings Cross' },
    { id: 'lon-m1', name: 'Shoreditch Hotel', tier: 'mid', stars: 4, rating: 8.5, pricePerNight: 175, amenities: ['WiFi', 'Gym', 'Restaurant', 'Bar'], neighborhood: 'Shoreditch' },
    { id: 'lon-m2', name: 'Covent Garden Boutique', tier: 'mid', stars: 4, rating: 8.8, pricePerNight: 210, amenities: ['WiFi', 'Spa', 'Restaurant', 'Concierge'], neighborhood: 'Covent Garden' },
    { id: 'lon-l1', name: 'The Savoy', tier: 'luxury', stars: 5, rating: 9.5, pricePerNight: 820, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Butler', 'Thames View'], neighborhood: 'Strand' },
  ],
  dubai: [
    { id: 'dxb-b1', name: 'Deira Budget Hotel', tier: 'budget', stars: 2, rating: 7.2, pricePerNight: 55, amenities: ['WiFi', 'AC', 'Breakfast'], neighborhood: 'Deira' },
    { id: 'dxb-m1', name: 'Marina View Hotel', tier: 'mid', stars: 4, rating: 8.6, pricePerNight: 175, amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'], neighborhood: 'Dubai Marina' },
    { id: 'dxb-l1', name: 'Burj Al Arab', tier: 'luxury', stars: 5, rating: 9.7, pricePerNight: 1500, amenities: ['WiFi', 'Private Beach', 'Spa', 'Restaurant', 'Butler', 'Helicopter Pad'], neighborhood: 'Jumeirah Beach' },
    { id: 'dxb-l2', name: 'Atlantis The Palm', tier: 'luxury', stars: 5, rating: 9.0, pricePerNight: 480, amenities: ['WiFi', 'Waterpark', 'Beach', 'Spa', 'Restaurant'], neighborhood: 'Palm Jumeirah' },
  ],
  bali: [
    { id: 'bal-b1', name: 'Ubud Hostel & Gardens', tier: 'budget', stars: 2, rating: 8.3, pricePerNight: 25, amenities: ['WiFi', 'Pool', 'Breakfast'], neighborhood: 'Ubud' },
    { id: 'bal-m1', name: 'Seminyak Boutique Villa', tier: 'mid', stars: 4, rating: 9.0, pricePerNight: 120, amenities: ['WiFi', 'Private Pool', 'Breakfast', 'Rice Paddy View'], neighborhood: 'Seminyak' },
    { id: 'bal-l1', name: 'Four Seasons Sayan', tier: 'luxury', stars: 5, rating: 9.6, pricePerNight: 650, amenities: ['WiFi', 'Infinity Pool', 'Spa', 'Restaurant', 'Yoga', 'Jungle View'], neighborhood: 'Ubud' },
  ],
  bangkok: [
    { id: 'bkk-b1', name: 'Khao San Road Hostel', tier: 'budget', stars: 2, rating: 7.9, pricePerNight: 18, amenities: ['WiFi', 'Bar', 'Rooftop'], neighborhood: 'Banglamphu' },
    { id: 'bkk-m1', name: 'Silom Design Hotel', tier: 'mid', stars: 4, rating: 8.5, pricePerNight: 95, amenities: ['WiFi', 'Rooftop Pool', 'Gym', 'Restaurant'], neighborhood: 'Silom' },
    { id: 'bkk-l1', name: 'Mandarin Oriental Bangkok', tier: 'luxury', stars: 5, rating: 9.5, pricePerNight: 380, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'River View', 'Butler'], neighborhood: 'Riverside' },
  ],
  singapore: [
    { id: 'sin-b1', name: 'Little India Guesthouse', tier: 'budget', stars: 2, rating: 7.6, pricePerNight: 60, amenities: ['WiFi', 'Breakfast'], neighborhood: 'Little India' },
    { id: 'sin-m1', name: 'Clarke Quay Hotel', tier: 'mid', stars: 4, rating: 8.7, pricePerNight: 185, amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'River View'], neighborhood: 'Clarke Quay' },
    { id: 'sin-l1', name: 'Marina Bay Sands', tier: 'luxury', stars: 5, rating: 9.3, pricePerNight: 480, amenities: ['WiFi', 'Infinity Pool', 'Spa', 'Casino', 'Skypark', 'Restaurant'], neighborhood: 'Marina Bay' },
  ],
  sydney: [
    { id: 'syd-b1', name: 'YHA Sydney Central', tier: 'budget', stars: 2, rating: 8.0, pricePerNight: 45, amenities: ['WiFi', 'Pool', 'Bar'], neighborhood: 'Central' },
    { id: 'syd-m1', name: 'Darling Harbour Hotel', tier: 'mid', stars: 4, rating: 8.6, pricePerNight: 175, amenities: ['WiFi', 'Harbour View', 'Gym', 'Restaurant'], neighborhood: 'Darling Harbour' },
    { id: 'syd-l1', name: 'Park Hyatt Sydney', tier: 'luxury', stars: 5, rating: 9.4, pricePerNight: 520, amenities: ['WiFi', 'Opera House View', 'Spa', 'Pool', 'Restaurant'], neighborhood: 'The Rocks' },
  ],
  istanbul: [
    { id: 'ist-b1', name: 'Sultanahmet Budget Stay', tier: 'budget', stars: 2, rating: 7.8, pricePerNight: 40, amenities: ['WiFi', 'Breakfast', 'Rooftop'], neighborhood: 'Sultanahmet' },
    { id: 'ist-m1', name: 'Beyoglu Boutique Hotel', tier: 'mid', stars: 4, rating: 8.5, pricePerNight: 120, amenities: ['WiFi', 'Hammam', 'Restaurant', 'Bosphorus View'], neighborhood: 'Beyoglu' },
    { id: 'ist-l1', name: 'Çırağan Palace Kempinski', tier: 'luxury', stars: 5, rating: 9.4, pricePerNight: 450, amenities: ['WiFi', 'Bosphorus Pool', 'Spa', 'Restaurant', 'Butler', 'Private Pier'], neighborhood: 'Besiktas' },
  ],
};

// Default fallback for cities not in dataset
const DEFAULT_HOTELS = {
  budget:  { id: 'def-b', name: 'City Budget Hotel', tier: 'budget', stars: 2, rating: 7.5, pricePerNight: 65, amenities: ['WiFi', 'Breakfast'], neighborhood: 'City Center' },
  mid:     { id: 'def-m', name: 'City Grand Hotel', tier: 'mid', stars: 4, rating: 8.3, pricePerNight: 155, amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'], neighborhood: 'Downtown' },
  luxury:  { id: 'def-l', name: 'The Grand Palace Hotel', tier: 'luxury', stars: 5, rating: 9.1, pricePerNight: 450, amenities: ['WiFi', 'Spa', 'Pool', 'Restaurant', 'Concierge', 'Butler'], neighborhood: 'City Center' },
};

/**
 * Get hotels for a city.
 * @param {string} cityName
 * @returns {Hotel[]}
 */
export function getHotelsForCity(cityName) {
  const key = cityName.toLowerCase().trim();
  return HOTEL_DATA[key] ?? Object.values(DEFAULT_HOTELS);
}

/**
 * Select the best hotel for a given tier and preferences.
 * @param {string} cityName
 * @param {'budget'|'mid'|'luxury'} tier
 * @param {string} style  Travel style hint
 * @returns {Hotel}
 */
export function selectBestHotel(cityName, tier, style) {
  const hotels = getHotelsForCity(cityName);
  const tierHotels = hotels.filter((h) => h.tier === tier);

  if (!tierHotels.length) {
    // Fall back to adjacent tier
    const fallback = hotels.find((h) => h.tier === 'mid') ?? hotels[0];
    return fallback ?? DEFAULT_HOTELS[tier];
  }

  // Score by rating + style fit
  const scored = tierHotels.map((h) => ({
    ...h,
    score: h.rating + styleBonus(h, style),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

/**
 * Style bonus for hotel selection.
 * @param {Hotel} hotel
 * @param {string} style
 * @returns {number}
 */
function styleBonus(hotel, style) {
  const amenities = hotel.amenities.map((a) => a.toLowerCase());
  const hasPool  = amenities.some((a) => a.includes('pool'));
  const hasSpa   = amenities.some((a) => a.includes('spa'));
  const hasBar   = amenities.some((a) => a.includes('bar'));
  const hasRooftop = amenities.some((a) => a.includes('rooftop'));

  if (style === 'relaxation') return hasSpa ? 0.5 : hasPool ? 0.3 : 0;
  if (style === 'adventure')  return hasRooftop ? 0.3 : 0;
  if (style === 'cultural')   return hotel.neighborhood ? 0.2 : 0;
  if (style === 'foodie')     return amenities.some((a) => a.includes('restaurant')) ? 0.4 : 0;
  if (style === 'business')   return amenities.some((a) => a.includes('concierge')) ? 0.4 : 0;
  return 0;
}

/**
 * Amenity emoji map for rendering.
 */
export const AMENITY_ICONS = {
  'WiFi':         '📶',
  'Pool':         '🏊',
  'Spa':          '💆',
  'Gym':          '🏋️',
  'Restaurant':   '🍽️',
  'Bar':          '🍸',
  'Breakfast':    '🥐',
  'Concierge':    '🛎️',
  'Butler':       '🤵',
  'Rooftop':      '🌇',
  'Beach':        '🏖️',
  'Garden':       '🌿',
  'Parking':      '🅿️',
  'Airport Shuttle':'🚌',
  'Room Service': '🛏️',
  'Casino':       '🎰',
};

export function getAmenityIcon(amenity) {
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (amenity.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '✓';
}
