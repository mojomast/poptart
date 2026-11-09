"""Derived assets only. Every FFmpeg invocation is capped to two threads."""
import json, subprocess, pathlib, wave, hashlib
import numpy as np
from PIL import Image

root=pathlib.Path(__file__).resolve().parent.parent
s=json.loads((root/'settings.json').read_text()); cache=root/'.cache';cache.mkdir(exist_ok=True)
def ff(args,report=False):
    r=subprocess.run(['ffmpeg','-hide_banner','-nostdin','-threads','2','-filter_threads','2',*args],cwd=root,check=True,capture_output=True,text=True)
    return r.stderr if report else r
def measure(file):
    out=ff(['-i',str(file),'-af','loudnorm=I=-14:TP=-1.3:LRA=11:print_format=json','-threads','2','-f','null','-'],True)
    return json.JSONDecoder().raw_decode(out[out.rfind('{'):])[0]
src=root/'inputs/complex-demo-packaged.mp4'
stamp=hashlib.sha256(src.read_bytes()+(root/'settings.json').read_bytes()+pathlib.Path(__file__).read_bytes()).hexdigest()
if not (cache/'media-stamp').exists() or (cache/'media-stamp').read_text()!=stamp:
    ff(['-y','-i',str(src),'-ss',str(s['audioSourceStart']),'-t','40','-vn','-af','afade=t=in:st=0:d=0.02,afade=t=out:st=38.5:d=1.5','-ar','48000','-c:a','pcm_s24le','-threads','2',str(cache/'excerpt.wav')])
    m=measure(cache/'excerpt.wav')
    # Preserve the sparse intro's dynamics. Apply gain plus a 4x-oversampled
    # peak limiter, then close the measurement loop (no time stretching).
    gain=-14-float(m['input_i'])
    for attempt in range(12):
        norm=f'aresample=192000,volume={gain}dB,alimiter=limit=0.82:level=false:attack=5:release=80:latency=true,aresample=48000'
        ff(['-y','-i',str(cache/'excerpt.wav'),'-af',norm,'-t','40','-ar','48000','-c:a','pcm_s24le','-threads','2',str(cache/'master.wav')])
        master=measure(cache/'master.wav');error=-14-float(master['input_i'])
        if abs(error)<0.08:break
        gain+=error*1.6
    assert abs(float(master['input_i'])+14)<0.15, master
    assert float(master['input_tp'])<=-1.3, master
    (cache/'loudness.json').write_text(json.dumps({'input':m,'master':master,'gainDb':gain,'limiter':'4x oversampled, 0.82 ceiling, 5ms attack / 80ms release, latency compensated'},indent=2))
    ff(['-y','-i',str(cache/'master.wav'),'-ac','1','-ar','24000','-c:a','pcm_s16le','-threads','2',str(cache/'analysis.wav')])
    w=wave.open(str(cache/'analysis.wav'));x=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float64)/32768;sr=w.getframerate()
    peaks=[float(np.max(np.abs(a))) for a in np.array_split(x,2400)]
    rms=[float(np.sqrt(np.mean(a*a))) for a in np.array_split(x,336)]
    (cache/'audio-data.json').write_text(json.dumps({'peaks':peaks,'steps':rms,'sampleRate':sr,'sourceStart':s['audioSourceStart'],'bpm':s['bpm']}))
    frames=cache/'source-frames';frames.mkdir(exist_ok=True)
    # No scale filter: preserve source pixels. Output timestamps are 60 fps.
    ff(['-y','-i',str(src),'-ss',str(s['audioSourceStart']),'-t','40','-vf','fps=60','-an','-q:v','2','-threads','2',str(frames/'%05d.jpg')])
    (cache/'media-stamp').write_text(stamp)
# Stable low-amplitude paper, not a temporal noise layer.
rng=np.random.default_rng(230126)
Image.fromarray(rng.integers(0,256,(256,256),dtype=np.uint8)).save(cache/'grain.png')
# Exact eight-arm geometry of the banner, measured at x98..203 / y163..268.
(cache/'asterisk.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106 106"><g fill="#A3E635" transform="translate(53 53)">'+''.join(f'<rect x="-7" y="-53" width="14" height="106" transform="rotate({a})"/>' for a in (0,45,90,135))+'</g></svg>')
print('Audio master, real waveform, exact logo and native-resolution 60fps frame cache prepared.')
