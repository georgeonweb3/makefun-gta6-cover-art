// The five colour grades. Every grade names the sky, the sun, the neon lines, the
// panel wash, the frame and the two caption inks, so every layout reads one object.
export const GRADES = {
  'vice-sunset': {
    name: 'Vice Sunset',
    skyTop: '#2b0f4a', skyMid: '#b0306e', skyBot: '#ff7a3d',
    sun: '#ffd166', sunCore: '#fff3c4',
    neon: '#ff2e88', neon2: '#00e5ff',
    panel: '#1c0b2e', frame: '#14081f',
    title: '#ffffff', subtitle: '#ffd166',
  },
  'neon-nights': {
    name: 'Neon Nights',
    skyTop: '#0b1035', skyMid: '#4b1d8f', skyBot: '#ff2e88',
    sun: '#00e5ff', sunCore: '#d6fbff',
    neon: '#ff2e88', neon2: '#ffe14d',
    panel: '#0e0b26', frame: '#0b1035',
    title: '#ffffff', subtitle: '#00e5ff',
  },
  'palm-dusk': {
    name: 'Palm Dusk',
    skyTop: '#04263b', skyMid: '#00796b', skyBot: '#ffd166',
    sun: '#ff9a3d', sunCore: '#fff0c2',
    neon: '#00e5a0', neon2: '#ffd166',
    panel: '#04263b', frame: '#031a28',
    title: '#ffffff', subtitle: '#ffd166',
  },
  'heat-wave': {
    name: 'Heat Wave',
    skyTop: '#3d0a0a', skyMid: '#a31621', skyBot: '#ff9a3d',
    sun: '#ffe14d', sunCore: '#fffbe0',
    neon: '#ff2e2e', neon2: '#ffb347',
    panel: '#2a0606', frame: '#1c0404',
    title: '#ffffff', subtitle: '#ffb347',
  },
  'chrome-blue': {
    name: 'Chrome Blue',
    skyTop: '#0a1c3f', skyMid: '#2f6bff', skyBot: '#9fd8ff',
    sun: '#e8f2ff', sunCore: '#ffffff',
    neon: '#2f6bff', neon2: '#ff5e7a',
    panel: '#0a1c3f', frame: '#06122b',
    title: '#ffffff', subtitle: '#9fd8ff',
  },
};

export function grade(name) {
  return GRADES[name] ?? GRADES['vice-sunset'];
}
