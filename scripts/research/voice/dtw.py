"""Which respelling makes the engine say a word the way the original does: DTW distance
(MFCC-like features) from each candidate to the reference spelling.

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
Needs SMOOTHTALKER_DIR (default ./st): a clone of joshknnd1982/smoothTalker-sbaitso.
"""
import os
import sys, numpy as np
ST=os.environ.get('SMOOTHTALKER_DIR','st')
sys.path.insert(0,os.path.join(ST,'synthDrivers'))
from _smoothtalker_engine.core import Engine
from scipy.signal import stft
from scipy.fft import dct
e=Engine(os.path.join(ST,'synthDrivers','_smoothtalker_engine','engine.bin'))
def feat(t):
    p,sr=e.speak(t); x=(np.frombuffer(p,np.uint8).astype(float)-128)/128
    nz=np.where(np.abs(x)>0.03)[0]; x=x[nz[0]:nz[-1]]
    f,_,Z=stft(x,sr,nperseg=256,noverlap=192); S=np.log(np.abs(Z)**2+1e-6)
    return dct(S,axis=0,norm='ortho')[1:14].T, len(x)
def dtw(A,B):
    n,m=len(A),len(B); D=np.full((n+1,m+1),np.inf); D[0,0]=0
    C=np.linalg.norm(A[:,None]-B[None],axis=2)
    for i in range(1,n+1):
        for j in range(1,m+1): D[i,j]=C[i-1,j-1]+min(D[i-1,j],D[i,j-1],D[i-1,j-1])
    return D[n,m]/(n+m)
groups={'SBAITSO':["SPAYTSO","SPATE SO","SBAYTSO","SBATESO","SBITESO","SUH BAIT SO","SBAT SO","S BAIT SO","SBAI TSO","SBEYETSO","SBIT SO","SABAITSO","ESS BAITSO","BAITSO","SPITE SO"],
'1991':["NINETEEN NINETY ONE","NINETEEN NINETY-ONE","ONE NINE NINE ONE","ONE THOUSAND NINE HUNDRED NINETY ONE","ONE, NINE, NINE, ONE","ONE THOUSAND, NINE HUNDRED NINETY ONE"],
'CPU':["C P U","CUP YOU","SEE PEW","KUP","SIPPU","CPU."]}
for ref,c in groups.items():
    R,lr=feat(ref); out=[]
    for t in c:
        F,l=feat(t); out.append((dtw(R,F),t,l))
    print('==',ref,lr); [print('   %.3f %-40s len %d'%o) for o in sorted(out)]
