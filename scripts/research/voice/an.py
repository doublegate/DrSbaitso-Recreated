"""Pitch (F0) and spectral-band summary of 8-bit unsigned WAV captures, e.g. the original
program recorded in DOSBox. Usage: python an.py capture1.wav [capture2.wav ...]

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
"""
import sys, wave, numpy as np
from scipy.signal import welch
def load(f):
    w=wave.open(f);sr=w.getframerate();a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.uint8).astype(float)-128;return a/128,sr
def f0track(x,sr,fmin=35,fmax=300):
    N=int(0.04*sr);H=int(0.01*sr);out=[]
    for i in range(0,len(x)-N,H):
        fr=x[i:i+N]-np.mean(x[i:i+N])
        if np.sqrt(np.mean(fr**2))<0.05: continue
        ac=np.correlate(fr,fr,'full')[N-1:]
        lo,hi=int(sr/fmax),int(sr/fmin)
        if hi>=N: hi=N-1
        k=lo+np.argmax(ac[lo:hi])
        if ac[k]/ac[0]>0.5: out.append(sr/k)
    return np.array(out)
if __name__=="__main__":
 for f in sys.argv[1:]:
     x,sr=load(f)
     p=f0track(x,sr)
     fr,P=welch(x,sr,nperseg=512)
     tot=P.sum()
     band=lambda a,b:100*P[(fr>=a)&(fr<b)].sum()/tot
     cen=(fr*P).sum()/tot
     rms=np.sqrt(np.mean(x**2))
     print(f"{f:12s} f0 n={len(p)} med={np.median(p) if len(p) else 0:.0f} p10={np.percentile(p,10) if len(p) else 0:.0f} p90={np.percentile(p,90) if len(p) else 0:.0f} | <150:{band(0,150):.1f}% 150-300:{band(150,300):.1f}% 300-1k:{band(300,1000):.1f}% 1-2k:{band(1000,2000):.1f}% 2-3k:{band(2000,3000):.1f}% 3-4.24k:{band(3000,4300):.1f}% centroid={cen:.0f}Hz rms={rms:.3f}")
