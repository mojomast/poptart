// Desktop SDK registration shape verified against Hermes 486f4a6; runtime untested.
// Explicitly a setup stub: a trusted bridge and player URL must be configured first.
import { jsx, jsxs } from 'react/jsx-runtime'
export default {
  id: 'hermes-strudel-studio',
  name: 'Strudel Studio',
  register(ctx) {
    ctx.register({
      id: 'pane', area: 'panes', title: 'Strudel Studio',
      data: { placement: 'right', width: '320px' },
      render: () => jsxs('div', { style: { padding: 16 }, children: [
        jsx('strong', { children: 'Strudel Studio' }),
        jsx('p', { children: 'Integration setup required. See INTEGRATION.md in the Studio repository.' })
      ] })
    })
  }
}
