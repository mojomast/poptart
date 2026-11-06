import assert from 'node:assert/strict';

// Shared by production standalone and the actual plugin.js/opaque Webapp shell.
export const complexPattern = `stack(
  s("bd ~ bd [~ bd]").gain(0.7),
  s("~ sd ~ sd").gain(0.45),
  s("hh*8").gain("0.1 0.25"),
  note("c2 c2 eb2 g1").s("triangle").decay(0.15).gain(0.35),
  note("c4 eb4 g4 bb4 g4 eb4 d4 g4").s("sine").decay(0.12).gain(0.15),
  note("<c3 eb3 g3 bb3>").s("sawtooth").lpf(700).gain(0.08),
  note("[c5 g5] [eb5 bb5] [g5 d6] [bb5 f6]").s("sine").gain(0.08),
  s("hh ~ [hh hh] ~").speed(0.7).gain(0.1),
  note("~ c6 ~ g5").s("triangle").decay(0.08).gain(0.1)
)`;

export async function testHighlights({page, player, audio, audioFrame, screenshot}) {
  const editor = player.getByLabel('Pattern code');
  const marks = player.locator('.mini-highlight');
  const signature = () => marks.evaluateAll(nodes => nodes.map(n => `${n.dataset.start}:${n.dataset.end}`).join(','));
  await editor.fill(complexPattern);
  await audio.getByRole('button',{name:'Play',exact:true}).click();
  await marks.first().waitFor({timeout:15000});
  const seen = new Set();
  for (let i=0;i<20;i++) {
    seen.add(await signature());
    await page.waitForTimeout(65);
  }
  assert.ok(seen.size>3, `mini-notation marks must move, got ${seen.size} frames`);
  const locations = await marks.evaluateAll(nodes => nodes.map(n => ({start:+n.dataset.start,end:+n.dataset.end,text:n.textContent})));
  for (const loc of locations) assert.equal(loc.text, complexPattern.slice(loc.start,loc.end));
  assert.ok(locations.some(loc => /[a-g]|bd|sd|hh/.test(loc.text)), 'musical tokens must light up');
  const paint = await marks.first().evaluate(el => ({outline:getComputedStyle(el).outlineColor, accent:getComputedStyle(document.documentElement).getPropertyValue('--studio-accent').trim(), text:getComputedStyle(el).color}));
  assert.equal(paint.text, 'rgba(0, 0, 0, 0)', 'mirror must not double-paint code text');
  assert.ok(paint.outline && paint.outline!=='rgba(0, 0, 0, 0)');
  if (screenshot) {
    await editor.evaluate(el=>el.blur());
    await page.screenshot({path:screenshot});
  }
  // Freezing Web Audio freezes scheduler time, despite RAF/wall time advancing.
  await audioFrame.evaluate(()=>window.__studioAnalyser.context.suspend());
  await page.waitForTimeout(100);
  const frozen=await signature();
  assert.ok(frozen.length);
  await page.waitForTimeout(350);
  assert.equal(await signature(),frozen,'highlights must follow scheduler time, not wall clock');
  await audioFrame.evaluate(()=>window.__studioAnalyser.context.resume());
  // Never point last-good offsets at an edited, unevaluated buffer.
  await editor.fill('// shifted buffer\n'+complexPattern);
  assert.equal(await marks.count(),0,'dirty offsets must not highlight the wrong text');
  for (const invalid of ['s("bd*4)', 'setcps(0); s("bd*4").poptartMissingMethod()']) {
    await editor.fill(invalid);
    await audio.getByRole('button',{name:'Play',exact:true}).click();
    await audio.getByRole('alert').waitFor();
    await audio.getByRole('status').getByText('Playing',{exact:true}).waitFor();
    assert.equal(await marks.count(),0);
    // Restoring the last evaluated buffer needs no apply: the old pattern and
    // its locations must still be alive after both syntax/runtime failures.
    await editor.fill(complexPattern);
    await marks.first().waitFor({timeout:3000});
  }
  await audio.getByRole('button',{name:'Stop',exact:true}).click();
  await audio.getByRole('status').getByText('Stopped',{exact:true}).waitFor();
  assert.equal(await marks.count(),0,'Stop must clear all highlights');
  await page.waitForTimeout(200);
  assert.equal(await marks.count(),0,'stopped RAF must not repaint highlights');
  // Leave each existing regression at its original sample pattern/transport.
  await editor.fill('s("bd*4")');
  await audio.getByRole('button',{name:'Play',exact:true}).click();
  await marks.first().waitFor();
  const replacement=await marks.allTextContents();
  assert.ok(replacement.includes('bd') && replacement.every(text=>text==='bd'||text==='4'), 'successful apply replaces old locations (Strudel also marks the repeat count)');
  console.log('HIGHLIGHT_TEST',JSON.stringify({movingFrames:seen.size,validLocations:true,schedulerClock:true,dirtyPositionsHidden:true,invalidEditRetainsLocations:true,stopClears:true,screenshot}));
}
