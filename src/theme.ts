/** Public SDK theme data only. Never host DOM styles, custom CSS, URLs or secrets. */
export interface StudioTheme { version: 1; scheme: 'dark' | 'light'; colors: Record<string,string>; typography: Record<string,string> }
const defaults: Record<string,string> = {
  background:'#17171b', foreground:'#ececf0', card:'#202024', muted:'#29292f', mutedForeground:'#9b9ba8',
  primary:'#b3a0ed', primaryForeground:'#18131f', secondary:'#29292f', secondaryForeground:'#ececf0',
  border:'#41414b', input:'#29292f', ring:'#b3a0ed', destructive:'#ffb4ab',
};
const keys = [...Object.keys(defaults),'midground','sidebarBackground','sidebarBorder'];
export function normalizeTheme(value: unknown): StudioTheme {
  const input = value && typeof value === 'object' ? value as Partial<StudioTheme> : {};
  const colors = {...defaults};
  if (input.version === 1 && input.colors && typeof input.colors === 'object') {
    for (const key of keys) {
      const color = input.colors[key];
      if (typeof color === 'string' && color.length <= 160 && !/var\(|url\(|inherit|currentcolor/i.test(color) && CSS.supports('color',color)) colors[key] = color;
    }
  }
  const typography: Record<string,string> = {fontSans:'Inter,ui-sans-serif,system-ui,sans-serif',fontMono:'ui-monospace,SFMono-Regular,monospace'};
  if (input.version === 1 && input.typography && typeof input.typography === 'object') {
    for (const key of ['fontSans','fontMono']) {
      const font = input.typography[key];
      if (typeof font === 'string' && font.length <= 200 && CSS.supports('font-family',font)) typography[key] = font;
    }
  }
  return {version:1,scheme:input.version === 1 && input.scheme === 'light' ? 'light' : 'dark',colors,typography};
}
export function applyTheme(value: unknown): StudioTheme {
  const theme = normalizeTheme(value), c = theme.colors;
  const variables: Record<string,string> = {
    bg:c.background, surface:c.card, sidebar:c.sidebarBackground || c.card, text:c.foreground, muted:c.mutedForeground,
    subtle:c.muted, accent:c.midground || c.ring || c.primary, border:c.border, 'sidebar-border':c.sidebarBorder || c.border,
    error:c.destructive, 'editor-bg':c.background, 'editor-text':c.foreground, 'editor-gutter':c.mutedForeground,
    'button-bg':c.secondary, 'button-text':c.secondaryForeground, 'primary-bg':c.primary, 'primary-text':c.primaryForeground,
    'input-bg':c.input, 'font-sans':theme.typography.fontSans, 'font-mono':theme.typography.fontMono,
  };
  for (const [key,value] of Object.entries(variables)) document.documentElement.style.setProperty('--studio-'+key,value);
  document.documentElement.style.colorScheme = theme.scheme;
  return theme;
}
