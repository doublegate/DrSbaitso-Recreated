"""Sweeps the engine's pitch, speed, tone, volume and gender settings and reports duration,
median F0, spectral centroid and level for each.

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
Needs SMOOTHTALKER_DIR (default ./st): a clone of joshknnd1982/smoothTalker-sbaitso.
"""
import os
import sys, wave, numpy as np
ST=os.environ.get('SMOOTHTALKER_DIR','st')
sys.path.insert(0,os.path.join(ST,'synthDrivers')); sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from _smoothtalker_engine.core import Engine
from an import f0track
from scipy.signal import welch
T="I AM HERE TO HELP YOU. SAY WHATEVER IS IN YOUR MIND FREELY."
def run(params):
    e=Engine(os.path.join(ST,'synthDrivers','_smoothtalker_engine','engine.bin')); e.configure(params)
    pcm,sr=e.speak(T); x=(np.frombuffer(pcm,np.uint8).astype(float)-128)/128
    p=f0track(x,sr); fr,P=welch(x,sr,nperseg=512); cen=(fr*P).sum()/P.sum(); lo=100*P[fr<300].sum()/P.sum()
    return len(x)/sr, np.median(p), cen, lo, np.sqrt(np.mean(x**2)), sr, x.min(), x.max()
print("default", run((0,0,5,5,5)))
for k in range(10): print("pitch",k, "%.2fs f0=%.0f cen=%.0f lo%%=%.1f rms=%.3f sr=%d"%run((0,0,5,k,5))[:6])
for k in range(10): print("speed",k, "%.2fs f0=%.0f cen=%.0f lo%%=%.1f rms=%.3f sr=%d"%run((0,0,5,5,k))[:6])
for k in (0,1): print("tone",k, "%.2fs f0=%.0f cen=%.0f lo%%=%.1f rms=%.3f sr=%d"%run((0,k,5,5,5))[:6])
for k in (0,5,9): print("vol",k, "%.2fs f0=%.0f cen=%.0f lo%%=%.1f rms=%.3f sr=%d min=%.2f max=%.2f"%run((0,0,k,5,5)))
print("gender1", "%.2fs f0=%.0f cen=%.0f lo%%=%.1f rms=%.3f sr=%d"%run((1,0,5,5,5))[:6])
