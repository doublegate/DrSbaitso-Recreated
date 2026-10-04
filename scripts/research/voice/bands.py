"""Relative level per frequency band of the SmoothTalker engine's output, for both tone
settings, plus 8-bit code usage. Basis of the band/tilt figures in ref-docs/02.

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
Needs SMOOTHTALKER_DIR (default ./st): a clone of joshknnd1982/smoothTalker-sbaitso.
"""
import os
import sys, numpy as np
ST=os.environ.get('SMOOTHTALKER_DIR','st')
sys.path.insert(0,os.path.join(ST,'synthDrivers'))
from _smoothtalker_engine.core import Engine
from scipy.signal import welch
txt=["HELLO JOHN, MY NAME IS DOCTOR SBAITSO. I AM HERE TO HELP YOU.","SAY WHATEVER IS IN YOUR MIND FREELY, OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.","WHY DO YOU FEEL THAT WAY? TELL ME MORE ABOUT YOUR PROBLEMS."]
for tone in (0,1):
    e=Engine(os.path.join(ST,'synthDrivers','_smoothtalker_engine','engine.bin')); e.configure((0,tone,5,5,5))
    x=np.concatenate([(np.frombuffer(e.speak(t)[0],np.uint8).astype(float)-128)/128 for t in txt])
    f,P=welch(x,8475,nperseg=1024)
    edges=[50,100,200,300,500,700,1000,1500,2000,2500,3000,3500,4237]
    lv=[10*np.log10(P[(f>=a)&(f<b)].mean()) for a,b in zip(edges,edges[1:])]
    ref=max(lv); print('tone',tone,' '.join('%d-%d:%+.0f'%(a,b,l-ref) for a,b,l in zip(edges,edges[1:],lv)))
    # 8-bit level usage + DC
    u=np.round(x*128+128); print('   levels used',len(np.unique(u)),'mean code %.1f'%u.mean(),'peak',u.min(),u.max())
