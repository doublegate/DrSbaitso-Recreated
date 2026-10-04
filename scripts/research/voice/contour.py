"""Frame-by-frame pitch contour, voicing strength and pause lengths of captured WAVs
(flat-intonation and pause measurements). Usage: python contour.py capture.wav

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
"""
import os
import sys, numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from an import load
def track(x,sr):
    N=int(0.04*sr);H=int(0.02*sr);res=[]
    for i in range(0,len(x)-N,H):
        fr=x[i:i+N]-np.mean(x[i:i+N]); r=np.sqrt(np.mean(fr**2))
        if r<0.04: res.append((i/sr,None,None,r));continue
        ac=np.correlate(fr,fr,'full')[N-1:]; lo,hi=int(sr/250),int(sr/45)
        k=lo+np.argmax(ac[lo:hi]); c=ac[k]/ac[0]
        res.append((i/sr, sr/k if c>0.5 else None, c, r))
    return res
for f in sys.argv[1:]:
    x,sr=load(f); t=track(x,sr)
    s=' '.join(('%3d'%f0 if f0 else ' . ') for _,f0,_,_ in t)
    cs=[c for _,f0,c,_ in t if f0]
    # pauses: runs of silent frames
    sil=[r<0.02 for *_,r in t]; runs=[];n=0
    for v in sil+[False]:
        if v:n+=1
        elif n: runs.append(n*20);n=0
    print(f, 'voiced autocorr median %.3f'%np.median(cs), 'pauses(ms)',runs); print(s)
