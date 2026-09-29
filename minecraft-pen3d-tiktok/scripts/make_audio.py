import numpy as np, wave

SR = 44100
FPS = 30
DUR = 15.0
N = int(SR * DUR)
out = np.zeros(N)

def t_of(frame):
    return frame / FPS

def add(sig, at):
    i = int(at * SR)
    j = min(N, i + len(sig))
    if i < N:
        out[i:j] += sig[: j - i]

def env(n, a=0.005, r=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a)
    if r:
        e *= np.exp(-t / r)
    return e

def square(freq, dur, duty=0.5):
    t = np.arange(int(dur * SR)) / SR
    return np.where((t * freq) % 1 < duty, 1.0, -1.0)

def tri(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    return 2 * np.abs(2 * ((t * freq) % 1) - 1) - 1

def note(m):
    return 440 * 2 ** ((m - 69) / 12)

beat = 0.5
bar = 2.0
prog = [(60, [60, 64, 67, 72]), (55, [55, 59, 62, 67]), (57, [57, 60, 64, 69]), (53, [53, 57, 60, 65])]

for b in range(int(DUR / bar) + 1):
    root, arp = prog[b % 4]
    t0 = b * bar
    for s in range(16):
        m = arp[s % 4] + (12 if s % 8 >= 4 else 0)
        d = 0.12
        sig = square(note(m + 12), d, 0.25) * env(int(d * SR), 0.002, 0.05) * 0.07
        add(sig, t0 + s * 0.125)
    for q in range(4):
        d = 0.45
        sig = tri(note(root - 24), d) * env(int(d * SR), 0.003, 0.25) * 0.35
        add(sig, t0 + q * beat)

def kick():
    d = 0.3
    t = np.arange(int(d * SR)) / SR
    f = 50 + 120 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.8

def snare():
    d = 0.2
    n = int(d * SR)
    t = np.arange(n) / SR
    return (np.random.uniform(-1, 1, n) * 0.5 + np.sin(2 * np.pi * 190 * t) * 0.4) * np.exp(-t * 18) * 0.45

def hat():
    d = 0.05
    n = int(d * SR)
    return np.random.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * 80) * 0.12

np.random.seed(7)
for k in range(int(DUR / beat)):
    tt = k * beat
    if tt >= 14.4:
        break
    add(kick(), tt)
    if k % 2 == 1:
        add(snare(), tt)
    add(hat(), tt + beat / 2)

def impact():
    d = 1.2
    n = int(d * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t * 8)) * t) * np.exp(-t * 3)
    noise = np.random.uniform(-1, 1, n) * np.exp(-t * 10) * 0.4
    return (boom + noise) * 0.7

def whoosh(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    nz = np.random.uniform(-1, 1, n)
    nz = np.convolve(nz, np.ones(8) / 8, mode="same")
    return nz * (t / d) ** 2 * 0.6

def riser(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = 200 + 1200 * (t / d) ** 2
    return square(1, d) * 0 + np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (t / d) ** 2 * 0.12

def pop(pitch):
    d = 0.12
    n = int(d * SR)
    t = np.arange(n) / SR
    f = pitch * (1 + 1.5 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * 0.55 + np.random.uniform(-1, 1, n) * np.exp(-t * 90) * 0.25

add(impact(), 0)
for f in (60, 90, 150, 285):
    add(whoosh(0.3), t_of(f) - 0.3)
    add(kick() * 0.6, t_of(f))
add(riser(1.0), t_of(330))
add(impact(), t_of(360))

pops = [13, 21, 38, 51, 64, 77, 90, 103, 116, 129]
for i, p in enumerate(pops):
    add(pop(300 + 40 * (i % 5)), t_of(150 + p))

fade = np.ones(N)
fs = int(13.8 * SR)
fade[fs:] = np.linspace(1, 0, N - fs)
out *= fade
out /= np.max(np.abs(out)) * 1.1
pcm = (out * 32767).astype(np.int16)
with wave.open("public/bgm.wav", "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
