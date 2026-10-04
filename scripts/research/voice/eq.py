"""Which spellings the engine renders byte-identically (abbreviations, numbers, initialisms),
used to derive the pronunciation map applied before TTS.

Salvaged from the v2.0 research scratch (2026-10); see README.md in this directory.
Needs SMOOTHTALKER_DIR (default ./st): a clone of joshknnd1982/smoothTalker-sbaitso.
"""
import os
import sys, numpy as np
ST=os.environ.get('SMOOTHTALKER_DIR','st')
sys.path.insert(0,os.path.join(ST,'synthDrivers'))
from _smoothtalker_engine.core import Engine
e=Engine(os.path.join(ST,'synthDrivers','_smoothtalker_engine','engine.bin'))
cache={}
def S(t):
    if t not in cache: cache[t]=e.speak(t)[0]
    return cache[t]
def sim(a,b):
    A,B=S(a),S(b)
    if A==B: return 'IDENTICAL'
    return 'diff (len %d vs %d)'%(len(A),len(B))
tests=[
 ("SBAITSO",["SBAITSO","sbaitso","S B A I T S O","SPAYTSO","SPATE SO","SUH BAIT SO","SUHBAITSO","SBATESO","ESS BAITSO"]),
 ("1991",["1991","NINETEEN NINETY ONE","ONE NINE NINE ONE","ONE THOUSAND NINE HUNDRED NINETY ONE","ONE THOUSAND NINE HUNDRED AND NINETY ONE"]),
 ("42",["42","FORTY TWO","FOUR TWO"]),
 ("DR. SMITH",["DR. SMITH","DOCTOR SMITH","D R SMITH","DRUH SMITH"]),
 ("MR. JONES",["MR. JONES","MISTER JONES","M R JONES"]),
 ("IRQ",["IRQ","I R Q","IRK","ERK"]),
 ("PM",["PM","P M","PIM"]),
 ("HELLO",["HELLO","hello","Hello"]),
 ("555-1234",["555-1234","FIVE FIVE FIVE ONE TWO THREE FOUR","FIVE FIVE FIVE, ONE TWO THREE FOUR","FIVE HUNDRED FIFTY FIVE ONE THOUSAND TWO HUNDRED THIRTY FOUR","FIVE HUNDRED FIFTY FIVE, ONE THOUSAND TWO HUNDRED THIRTY FOUR"]),
 ("3:45",["3:45","THREE FORTY FIVE","THREE FOUR FIVE","THREE COLON FORTY FIVE"]),
 ("ETC.",["ETC.","ET CETERA.","E T C.","ETSEE."]),
 ("VS.",["VS.","VERSUS.","V S.","VEE ESS."]),
 ("$5",["$5","FIVE DOLLARS","DOLLAR FIVE","5"]),
 ("CPU",["CPU","C P U","SEE PEE YOU"]),
 ("TEST.",["TEST.","TEST"]),
]
for ref,alts in tests:
    print('==',ref)
    for a in alts[1:]: print('   %-50s %s'%(a,sim(alts[0],a)))
