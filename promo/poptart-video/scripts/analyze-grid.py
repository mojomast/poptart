"""Audit audible beat and harmonic phase against the original supplied recording."""
import json,pathlib,subprocess,numpy as np
root=pathlib.Path(__file__).resolve().parent.parent
s=json.loads((root/'settings.json').read_text());sr=24000
r=subprocess.run(['ffmpeg','-v','error','-nostdin','-threads','2','-filter_threads','2','-i',str(root/'inputs/complex-demo-packaged.mp4'),'-vn','-ac','1','-ar',str(sr),'-c:a','pcm_s16le','-threads','2','-f','s16le','-'],check=True,capture_output=True)
x=np.frombuffer(r.stdout,np.int16).astype(float)/32768
energy=np.mean(x[:len(x)//24*24].reshape(-1,24)**2,axis=1)
smooth=np.convolve(energy,np.ones(4)/4,'same');flux=np.maximum(0,smooth-np.roll(smooth,5))
origins=[]
for beat in range(55):
    expected=s['sourceMainDownbeat']+beat*60/s['bpm'];lo=int((expected-.03)*1000);hi=int((expected+.05)*1000)
    origins.append((np.argmax(flux[lo:hi])+lo)/1000-beat*60/s['bpm'])
origin=float(np.median(origins));spread=float(np.std(origins))
assert abs(origin-s['sourceMainDownbeat'])<1/60 and spread<1/60
roots=[]
for bar in range(8):
    t=origin+bar*240/126+.14;a=x[int(t*sr):int((t+.30)*sr)]
    y=np.abs(np.fft.rfft(a*np.hanning(len(a)),131072));f=np.fft.rfftfreq(131072,1/sr)
    scores={n:float(y[np.abs(f-hz)<2].max()) for n,hz in [('A1',55),('F1',43.65),('C2',65.41),('G1',49)]}
    roots.append(max(scores,key=scores.get))
assert roots==['C2','G1','A1','F1']*2, roots
report={'bpm':s['bpm'],'mainAttackOrigin':origin,'attackGridStdSeconds':spread,'fittedBeats':55,'selectedDownbeat':s['audioSourceStart'],'mainEntryCycle':6,'measuredBassRoots':roots,'nativeCycleFormula':'filmSeconds * bpm / 240'}
(root/'.cache/beat-evidence.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
