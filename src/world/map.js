// The world as data: islands of hex tiles, bridges, and what stands on each island.
// Positions of props are in metres relative to the island centre (x east, z south), rotation in degrees (yaw).
import { disc } from './hex.js';

export const LEVEL_H = 0.42; // height of one terrace level

function island(id, cq, cr, radius, opts = {}) {
  const tiles = [];
  const skip = new Set(opts.skip || []);
  for (const [dq, dr] of disc(radius)) {
    const k = `${dq},${dr}`;
    if (skip.has(k)) continue;
    tiles.push({ q: cq + dq, r: cr + dr, dq, dr, type: (opts.type && opts.type(dq, dr)) || 'grass', level: (opts.level && opts.level(dq, dr)) || 0 });
  }
  for (const [dq, dr, type, level] of opts.extra || []) tiles.push({ q: cq + dq, r: cr + dr, dq, dr, type: type || 'grass', level: level || 0 });
  return { id, cq, cr, tiles, ...opts.meta };
}

const ring = (dq, dr) => Math.max(Math.abs(dq), Math.abs(dr), Math.abs(-dq - dr));

export const islands = [
  island('home', 0, 0, 2, {
    type: (q, r) => (q === 0 && r === 0 ? 'cream' : (q === 0 || r === 0) && ring(q, r) <= 2 ? 'stone' : ring(q, r) === 2 && (q + r) % 3 === 0 ? 'grass_deep' : 'grass'),
    extra: [[3, -1, 'grass'], [3, -2, 'grass_deep'], [2, -3, 'sand'], [-1, 3, 'grass'], [-2, 3, 'grass_deep']],
    meta: { name: 'Home Island', label: 'Home' },
  }),
  island('services', 1, -6, 2, {
    type: (q, r) => (ring(q, r) <= 1 ? 'cream' : 'stone'),
    meta: { name: 'Services Bazaar', label: 'Services' },
  }),
  island('schooliee', 6, -5, 2, {
    type: (q, r) => (r === 1 && q <= 0 ? 'stone' : ring(q, r) === 2 && q > 0 ? 'grass_deep' : 'grass'),
    extra: [[3, -1, 'sand'], [2, -3, 'grass']],
    meta: { name: 'Schooliee Campus', label: 'Schooliee', project: 'schooliee' },
  }),
  island('karobari', 8, 1, 2, {
    type: (q, r) => (r === 0 || (q === 0 && r !== 2) ? 'stone' : 'grass'),
    meta: { name: 'Karobari Bazaar', label: 'Karobari', project: 'karobari' },
  }),
  island('whatsapp', 4, 5, 2, {
    type: (q, r) => (ring(q, r) === 0 ? 'cream' : ring(q, r) === 1 ? 'stone' : 'grass'),
    meta: { name: 'WhatsApp Gateway', label: 'WhatsApp', project: 'whatsapp-business-automation' },
  }),
  island('leadprofit', -3, 8, 2, {
    type: (q, r) => (r >= 1 ? 'stone' : r === 0 ? 'cream' : 'grass'),
    skip: ['2,0'],
    meta: { name: 'LeadProfit Harbour', label: 'LeadProfit', project: 'leadprofit' },
  }),
  island('dsme', -8, 6, 2, {
    type: (q, r) => (ring(q, r) <= 1 ? 'cream' : 'grass_deep'),
    meta: { name: 'DSME Globals Tower', label: 'DSME Globals', project: 'dsme-globals' },
  }),
  island('mobile', -8, 0, 2, {
    type: (q, r) => (ring(q, r) === 1 && (q + 2 * r) % 2 === 0 ? 'grass_deep' : 'grass'),
    meta: { name: 'Mobile Ecosystems Park', label: 'Mobile Apps', project: 'expo-mobile-apps' },
  }),
  island('timeline', -5, -6, 3, {
    type: (q, r) => (ring(q, r) === 3 ? 'grass' : ring(q, r) === 0 ? 'cream' : 'grass'),
    level: (q, r) => 3 - ring(q, r),
    skip: ['3,-3', '-3,3', '0,3'],
    meta: { name: 'Timeline Hill', label: 'Timeline' },
  }),
  island('garden', 12, -9, 3, {
    type: (q, r) => (r >= 2 ? 'stone' : ring(q, r) === 3 ? 'grass' : 'grass_deep'),
    meta: { name: 'GitHub Garden', label: 'GitHub' },
  }),
  island('park', 4, -1, 1, {
    type: (q, r) => (q === 0 && r === 0 ? 'stone' : 'grass'),
    meta: { name: 'Park of Voices', label: 'Testimonials' },
  }),
  island('cricket', -3, -2, 1, {
    type: () => 'sand',
    extra: [[-1, -1, 'sand'], [-2, 0, 'grass']],
    meta: { name: 'Cricket Pitch', label: 'Cricket' },
  }),
  island('lighthouse', 9, 7, 1, {
    type: (q, r) => (q === 0 && r === 0 ? 'cream' : 'sand'),
    meta: { name: 'Lighthouse Pier', label: 'Contact' },
  }),
];

// Bridges between islands. 'bridge' = wooden plank bridge, 'steps' = stepping stones.
export const bridges = [
  ['home', 'services', 'bridge'],
  ['home', 'park', 'bridge'],
  ['park', 'schooliee', 'bridge'],
  ['park', 'karobari', 'steps'],
  ['home', 'whatsapp', 'bridge'],
  ['home', 'leadprofit', 'bridge'],
  ['home', 'cricket', 'steps'],
  ['cricket', 'mobile', 'bridge'],
  ['cricket', 'timeline', 'bridge'],
  ['mobile', 'dsme', 'bridge'],
  ['dsme', 'leadprofit', 'steps'],
  ['services', 'timeline', 'steps'],
  ['services', 'schooliee', 'bridge'],
  ['schooliee', 'garden', 'bridge'],
  ['karobari', 'whatsapp', 'bridge'],
  ['whatsapp', 'lighthouse', 'bridge'],
  ['karobari', 'lighthouse', 'steps'],
];

// Props per island: [asset, x, z, rotDeg, extra]. extra.interact describes how the player can use it.
export const props = {
  home: [
    ['home_hut', -3.8, -3.6, 20],
    ['home_desk', 1.2, -4.4, -10, { interact: { type: 'desk', panel: 'about', prompt: 'Sit at the desk' } }],
    ['portrait_board', 5.0, -1.6, -55, { screen: 'portrait' }],
    ['number_6plus', -4.4, 2.2, 30, { plaque: ['years', 'shipping software'], interact: { type: 'panel', panel: 'about', prompt: 'Read: 6+ years shipping' } }],
    ['number_400plus', -1.2, 4.6, 15, { plaque: ['projects', 'built and launched'], interact: { type: 'panel', panel: 'about', prompt: 'Read: 400+ projects built' } }],
    ['signpost', 1.6, 1.4, 0, { signs: ['Services', 'Projects', 'Timeline', 'Contact'] }],
    ['bench', 4.6, 2.6, -120, { interact: { type: 'sit', prompt: 'Sit on the bench' } }],
    ['tree_blob_coral', -5.6, -0.4, 0], ['tree_pear_mint', 4.4, -5.6, 0], ['tree_cushion_deep', -2.0, 7.9, 0],
    ['palm', 6.6, 4.4, 40], ['tulips', -0.8, 2.6, 0], ['agave', 2.8, 4.2, 0], ['lamp_post', 1.6, -1.8, 0],
    ['idea_bulb', -4.6, -4.4, 0, { collect: 'bulb_home' }],
  ],
  services: [
    // A market row along the north edge, all facing the visitor's usual view.
    ['stall_whatsapp', -5.3, -2.4, 18, { interact: { type: 'service', service: 'whatsapp-ai', prompt: 'Try a live demo' } }],
    ['stall_saas', -1.8, -3.4, 6, { interact: { type: 'service', service: 'saas', prompt: 'Try a live demo' } }],
    ['stall_mobile', 1.8, -3.4, -6, { interact: { type: 'service', service: 'mobile', prompt: 'Try a live demo' } }],
    ['stall_desktop', 5.3, -2.4, -18, { interact: { type: 'service', service: 'desktop', prompt: 'Try a live demo' } }],
    ['lamp_post', -1.6, -5.4, 0], ['lamp_post', 1.6, 5.6, 0], ['tree_capsule_coral', -7.0, 0.4, 0], ['tree_capsule_coral', 7.0, 0.4, 0],
    ['crate_stack', 2.2, 6.2, 20],
  ],
  schooliee: [
    ['launch_pad', 0, 0, 0, { launch: 'schooliee' }],
    ['school', -2.4, -3.8, 0, { district: 'schooliee' }],
    ['school_van', 4.8, 1.6, -90, { district: 'schooliee' }],
    ['noticeboard', 5.0, -3.0, -60, { district: 'schooliee', screen: 'schooliee' }],
    ['slide', -4.4, 2.0, 60, { district: 'schooliee', interact: { type: 'slide', prompt: 'Go down the slide' } }],
    ['swing_set', 0.6, 4.2, 180, { district: 'schooliee', interact: { type: 'swing', prompt: 'Have a swing' } }],
    ['flagpole', -6.0, 0.4, 0, { district: 'schooliee' }],
    ['tree_pear_light', 5.6, 2.8, 0], ['tree_cushion_deep', -6.2, -2.4, 0],
    ['idea_bulb', -5.2, 3.6, 0, { collect: 'bulb_slide' }],
  ],
  karobari: [
    ['launch_pad', 0, 0, 0, { launch: 'karobari' }],
    ['storefront', 0.0, -4.4, 0, { district: 'karobari', screen: 'karobari' }],
    ['bazaar_stall', -5.4, -0.8, 55, { district: 'karobari' }],
    ['bazaar_stall', 5.4, -0.8, -55, { district: 'karobari' }],
    ['chai_stall', -3.8, 4.2, 145, { district: 'karobari' }],
    ['phone_stand', 3.2, 3.0, -140, { district: 'karobari', screen: 'karobari' }],
    ['tree_blob_coral', 6.4, 3.0, 0],
  ],
  whatsapp: [
    ['launch_pad', 0, 2.6, 0, { launch: 'whatsapp-business-automation' }],
    ['post_office', 0, -1.8, 0, { district: 'whatsapp-business-automation', interact: { type: 'planes', prompt: 'Send a burst of messages' } }],
    ['pigeon_loft', 4.2, -2.4, -30, { district: 'whatsapp-business-automation' }],
    ['mailbox', -3.0, 1.6, 30, { district: 'whatsapp-business-automation' }],
    ['tree_pear_mint', -5.6, -1.0, 0], ['tree_blob_mint', 5.4, 2.6, 0], ['cactus_finger', -4.4, 4.2, 0],
  ],
  leadprofit: [
    ['launch_pad', -2.2, -1.2, 0, { launch: 'leadprofit' }],
    ['warehouse', -2.6, -4.2, 0, { district: 'leadprofit' }],
    ['crane', 3.4, 1.8, -70, { district: 'leadprofit' }],
    ['price_board', 2.4, -3.6, -25, { district: 'leadprofit', screen: 'leadprofit' }],
    ['crate_stack', 0.6, 3.6, 0], ['crate', 1.8, 4.2, 30], ['barrel', -1.2, 4.6, 0], ['dock', 0, 7.2, 0], ['dock', 0, 9.2, 0],
  ],
  dsme: [
    ['launch_pad', 1.8, 1.8, 0, { launch: 'dsme-globals' }],
    ['glass_tower', -0.8, -2.0, 0, { district: 'dsme-globals' }],
    ['globe_sculpture', 3.2, -1.6, 0, { district: 'dsme-globals' }],
    ['billboard', -5.4, 2.6, 55, { district: 'dsme-globals', screen: 'dsme-globals' }],
    ['bench', 3.6, 3.6, -150, { interact: { type: 'sit', prompt: 'Sit on the bench' } }],
    ['tree_cushion_deep', -6.0, -0.6, 0], ['tree_pear_light', 5.6, -0.2, 0],
  ],
  mobile: [
    ['launch_pad', 0, 0, 0, { launch: 'expo-mobile-apps' }],
    ['phone_monolith', -3.0, -2.6, 20, { district: 'expo-mobile-apps', screen: 'expo-mobile-apps', interact: { type: 'phone', prompt: 'Tap the phone' } }],
    ['phone_monolith', 0.4, -4.4, 0, { district: 'expo-mobile-apps', screen: 'expo-mobile-apps', interact: { type: 'phone', prompt: 'Tap the phone' } }],
    ['phone_monolith', 3.6, -2.6, -20, { district: 'expo-mobile-apps', screen: 'expo-mobile-apps', interact: { type: 'phone', prompt: 'Tap the phone' } }],
    ['signal_tower', -4.8, 2.2, 0, { district: 'expo-mobile-apps' }],
    ['seesaw', 2.8, 3.0, 30, { district: 'expo-mobile-apps', interact: { type: 'seesaw', prompt: 'Ride the seesaw' } }],
    ['tree_blob_mint', 5.8, 0.6, 0], ['agave', -1.6, 5.2, 0],
  ],
  timeline: [
    ['summit_flag', 0, 0, 0, { interact: { type: 'panel', panel: 'timeline:today', prompt: 'Read the summit flag' } }],
    ['milestone_flag', -9.2, 3.2, 60, { interact: { type: 'panel', panel: 'timeline:0', prompt: 'Read the flag' } }],
    ['milestone_flag', -6.2, 6.8, 30, { interact: { type: 'panel', panel: 'timeline:1', prompt: 'Read the flag' } }],
    ['milestone_flag', 0.4, 8.4, 0, { interact: { type: 'panel', panel: 'timeline:2', prompt: 'Read the flag' } }],
    ['milestone_flag', -4.6, 2.2, 45, { interact: { type: 'panel', panel: 'timeline:3', prompt: 'Read the flag' } }],
    ['milestone_flag', 2.0, 4.6, -10, { interact: { type: 'panel', panel: 'timeline:4', prompt: 'Read the flag' } }],
    ['milestone_flag', -1.6, -3.2, 120, { interact: { type: 'panel', panel: 'timeline:5', prompt: 'Read the flag' } }],
    ['kite', 1.6, -1.0, 0, { float: 6 }], ['kite', -2.2, 1.6, 0, { float: 7.5 }],
    ['tree_pear_mint', 6.4, 2.2, 0], ['tree_capsule_coral', -7.6, -1.0, 0],
    ['idea_bulb', 0.9, 0.9, 0, { collect: 'bulb_summit' }],
  ],
  garden: [
    ['library_kiosk', -5.6, 7.0, 10, { interact: { type: 'panel', panel: 'repos', prompt: 'Browse the repositories' } }],
    ['toolshed', 4.6, 7.4, -10, { interact: { type: 'panel', panel: 'stack', prompt: 'Open the toolshed' } }],
    ['signpost', -0.6, 5.6, 0, { signs: ['GitHub Garden', 'A year of commits', 'Library', 'Toolshed'] }],
    ['tree_pear_mint', -9.0, 1.0, 0], ['tree_blob_coral', 9.2, -0.4, 0], ['tree_cushion_deep', 7.6, -6.4, 0], ['tree_pear_light', -7.8, -5.6, 0],
  ],
  park: [
    ['bench', -2.2, -1.6, 40, { npc: 0, interact: { type: 'sit', prompt: 'Sit and listen' } }],
    ['bench', 2.4, -1.4, -40, { npc: 1, interact: { type: 'sit', prompt: 'Sit and listen' } }],
    ['bench', 0.2, 2.6, 180, { npc: 2, interact: { type: 'sit', prompt: 'Sit and listen' } }],
    ['tree_blob_coral', -3.4, 1.8, 0], ['tree_pear_mint', 3.6, 1.6, 0], ['flower_patch', 0, 0, 0],
  ],
  cricket: [
    ['cricket_stumps', -2.4, -1.6, 30, { interact: { type: 'stumps' } }],
    ['ball', 0.6, 0.8, 0, { ball: true }],
    ['tree_capsule_coral', 2.8, -2.4, 0],
  ],
  lighthouse: [
    ['lighthouse', 0.8, -1.2, 0],
    ['mailbox', -1.6, 1.4, 20, { interact: { type: 'panel', panel: 'contact', prompt: 'Write to Mehfooz' } }],
    ['pier', 0, 4.4, 0], ['pier', 0, 6.4, 0], ['pier', 0, 8.4, 0],
    ['paper_boat', -0.6, 9.6, 0, { interact: { type: 'boat', prompt: 'Launch a paper boat' } }],
    ['idea_bulb', 2.6, 1.4, 0, { collect: 'bulb_pier' }],
  ],
};

// The idea bulbs reveal small facts from the profile.
export const bulbFacts = {
  bulb_home: 'Founder of Karobari: WhatsApp-first AI commerce for local merchants.',
  bulb_slide: 'Shipped 10+ mobile apps to the App Store and Google Play.',
  bulb_summit: 'BSCS from Virtual University of Pakistan, 2019 to 2023.',
  bulb_pier: 'Based in Faisalabad, Punjab. Building for businesses everywhere.',
};

export const spawn = { island: 'home', x: 0.2, z: 1.0, yaw: 180 };
