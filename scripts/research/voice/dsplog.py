"""Logs the Sound Blaster DSP commands and DMA block sizes the engine issues while speaking,
to confirm the playback rate (8475 Hz) and block structure.

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
Needs SMOOTHTALKER_DIR (default ./st): a clone of joshknnd1982/smoothTalker-sbaitso.
"""
import os
import sys, collections
ST=os.environ.get('SMOOTHTALKER_DIR','st')
sys.path.insert(0,os.path.join(ST,'synthDrivers'))
import _smoothtalker_engine.core as c
log=collections.Counter(); sizes=[]
orig=c._SoundBlaster._dsp
def d(self,v):
    if not self.pending: log[hex(v)]+=1
    orig(self,v)
c._SoundBlaster._dsp=d
oa=c._SoundBlaster._arm
def a(self,l): sizes.append(l); oa(self,l)
c._SoundBlaster._arm=a
e=c.Engine(os.path.join(ST,'synthDrivers','_smoothtalker_engine','engine.bin'))
p,sr=e.speak("HELLO, MY NAME IS DOCTOR SBAITSO.")
print(dict(log)); print('blocks',len(sizes),'sizes',sorted(set(sizes))[:10])
