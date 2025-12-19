export type PresetCategory = "수학" | "물리학" | "화학" | "생명과학" | "지구과학";

export interface Preset {
    id: string;
    category: PresetCategory;
    name: string;
    code: string;
}

export const DEFAULT_PRESET_ID = "math_lissajous_complex";

export const CORE_PRESETS: Preset[] = [
    // --- 수학 ---
    {
        id: "math_lissajous_complex",
        category: "수학",
        name: "Lissajous / Complex Demo",
        code: `# Lissajous / Complex Demo
f(t) = exp(-0.1*t) * (cos(5*t) + i*sin(5*t))
tmin = 0
tmax = 10`
    },
    {
        id: "math_circle_unit",
        category: "수학",
        name: "Circle (Unit)",
        code: `# Circle (Unit)
f(t) = cos(t) + i*sin(t)
tmin = 0
tmax = 6.283185307179586`
    },
    {
        id: "math_rose_k5",
        category: "수학",
        name: "Rose (k=5)",
        code: `# Rose (k=5)
f(t) = cos(5*t)*cos(t) + i*(cos(5*t)*sin(t))
tmin = 0
tmax = 6.283185307179586`
    },
    {
        id: "math_lemniscate",
        category: "수학",
        name: "Lemniscate (Bernoulli)",
        code: `# Lemniscate (Bernoulli)
f(t) = (cos(t)/(1+sin(t)*sin(t))) + i*((sin(t)*cos(t))/(1+sin(t)*sin(t)))
tmin = 0
tmax = 6.283185307179586`
    },
    {
        id: "math_archimedean",
        category: "수학",
        name: "Archimedean Spiral",
        code: `# Archimedean Spiral
f(t) = (0.15*t*cos(t)) + i*(0.15*t*sin(t))
tmin = 0
tmax = 37.69911184307752`
    },
    {
        id: "math_logarithmic",
        category: "수학",
        name: "Logarithmic Spiral",
        code: `# Logarithmic Spiral
f(t) = (exp(0.05*t)*cos(t)) + i*(exp(0.05*t)*sin(t))
tmin = 0
tmax = 56.548667764616276`
    },
    {
        id: "math_beating",
        category: "수학",
        name: "Beating (sin1+sin2)",
        code: `# Beating (sin1+sin2)
f(t) = (sin(10*t)+sin(11*t)) + 0*i
tmin = 0
tmax = 10`
    },
    {
        id: "math_fourier",
        category: "수학",
        name: "Fourier Series (Square-ish)",
        code: `# Fourier Series (Square-ish)
f(t) = (sin(t) + sin(3*t)/3 + sin(5*t)/5 + sin(7*t)/7) + 0*i
tmin = 0
tmax = 6.283185307179586`
    },
    {
        id: "math_cubic",
        category: "수학",
        name: "Polynomial (Cubic)",
        code: `# Polynomial (Cubic)
f(t) = (t*t*t - 3*t) + 0*i
tmin = -2.5
tmax = 2.5`
    },
    {
        id: "math_rational",
        category: "수학",
        name: "Rational (1/t)",
        code: `# Rational (1/t)
f(t) = (1/t) + 0*i
tmin = 0.2
tmax = 3`
    },
    {
        id: "math_exp_vs_log",
        category: "수학",
        name: "Exponential vs Log",
        code: `# Exponential vs Log
f(t) = exp(t) + i*log(1+t)
tmin = 0
tmax = 3`
    },
    {
        id: "math_cusp",
        category: "수학",
        name: "Absolute (Cusp)",
        code: `# Absolute (Cusp)
f(t) = sqrt(t*t) + 0*i
tmin = -4
tmax = 4`
    },

    // --- 물리학 ---
    {
        id: "phys_harmonic",
        category: "물리학",
        name: "Simple Harmonic (phasor)",
        code: `# Simple Harmonic (phasor)
f(t) = cos(8*t) + i*sin(8*t)
tmin = 0
tmax = 18.84955592153876`
    },
    {
        id: "phys_damped_osc",
        category: "물리학",
        name: "Damped Oscillator",
        code: `# Damped Oscillator
f(t) = exp(-0.08*t)*(cos(10*t)+i*sin(10*t))
tmin = 0
tmax = 25`
    },
    {
        id: "phys_chirp",
        category: "물리학",
        name: "Chirp (freq increases)",
        code: `# Chirp (freq increases)
f(t) = sin(t*t) + 0*i
tmin = 0
tmax = 30`
    },
    {
        id: "phys_gaussian_wave",
        category: "물리학",
        name: "Gaussian Wave Packet",
        code: `# Gaussian Wave Packet
f(t) = exp(-0.05*(t-25)*(t-25))*(cos(6*t) + i*sin(6*t))
tmin = 0
tmax = 50`
    },
    {
        id: "phys_standing_wave",
        category: "물리학",
        name: "Standing Wave (2-mode)",
        code: `# Standing Wave (2-mode)
f(t) = (sin(4*t)+0.6*sin(8*t)) + 0*i
tmin = 0
tmax = 6.283185307179586`
    },
    {
        id: "phys_projectile",
        category: "물리학",
        name: "Projectile",
        code: `# Projectile
f(t) = (t) + i*(t - 0.2*t*t)
tmin = 0
tmax = 6`
    },
    {
        id: "phys_kepler",
        category: "물리학",
        name: "Kepler Ellipse",
        code: `# Kepler Ellipse
f(t) = (2*cos(t)) + i*(1*sin(t))
tmin = 0
tmax = 6.283185307179586`
    },
    {
        id: "phys_damped_rot",
        category: "물리학",
        name: "Damped rotation",
        code: `# Damped rotation
f(t) = exp(-0.05*t)*(cos(6*t) + i*sin(6*t))
tmin = 0
tmax = 40`
    },

    // --- 화학 ---
    {
        id: "chem_1st_decay",
        category: "화학",
        name: "1st-order decay",
        code: `# 1st-order decay
f(t) = exp(-0.4*t) + 0*i
tmin = 0
tmax = 12`
    },
    {
        id: "chem_2nd_order",
        category: "화학",
        name: "2nd-order (1/(1+kt))",
        code: `# 2nd-order
f(t) = 1/(1+0.35*t) + 0*i
tmin = 0
tmax = 20`
    },
    {
        id: "chem_arrhenius",
        category: "화학",
        name: "Arrhenius-like",
        code: `# Arrhenius-like
f(t) = exp(-12/(t+1)) + 0*i
tmin = 0
tmax = 20`
    },
    {
        id: "chem_sigmoid",
        category: "화학",
        name: "H-H sigmoid",
        code: `# H-H sigmoid
f(t) = 1/(1+exp(-(t-7))) + 0*i
tmin = 0
tmax = 14`
    },
    {
        id: "chem_beer_lambert",
        category: "화학",
        name: "Beer–Lambert attenuation",
        code: `# Beer–Lambert
f(t) = exp(-0.6*t) + 0*i
tmin = 0
tmax = 10`
    },
    {
        id: "chem_lennard_jones",
        category: "화학",
        name: "Lennard–Jones Potential",
        code: `# Lennard–Jones V(r)
f(t) = 4*((1/(t*t*t*t*t*t*t*t*t*t*t*t)) - (1/(t*t*t*t*t*t))) + 0*i
tmin = 0.9
tmax = 3.0`
    },
    {
        id: "chem_morse",
        category: "화학",
        name: "Morse Potential",
        code: `# Morse Potential
f(t) = (1-exp(-1.2*(t-1)))*(1-exp(-1.2*(t-1))) - 1 + 0*i
tmin = 0
tmax = 4`
    },

    // --- 생명과학 ---
    {
        id: "bio_logistic",
        category: "생명과학",
        name: "Logistic Growth",
        code: `# Logistic Growth
f(t) = 1/(1+exp(-0.6*(t-10))) + 0*i
tmin = 0
tmax = 20`
    },
    {
        id: "bio_gompertz",
        category: "생명과학",
        name: "Gompertz Growth",
        code: `# Gompertz Growth
f(t) = exp(-exp(-0.5*(t-8))) + 0*i
tmin = 0
tmax = 20`
    },
    {
        id: "bio_michaelis",
        category: "생명과학",
        name: "Michaelis–Menten",
        code: `# Michaelis–Menten
f(t) = (t)/(1+t) + 0*i
tmin = 0
tmax = 10`
    },
    {
        id: "bio_hill",
        category: "생명과학",
        name: "Hill Function (n=4)",
        code: `# Hill Function
f(t) = (t*t*t*t)/(1+t*t*t*t) + 0*i
tmin = 0
tmax = 3`
    },
    {
        id: "bio_damped_osc",
        category: "생명과학",
        name: "Damped biological oscillation",
        code: `# Damped Oscillation
f(t) = exp(-0.05*t)*sin(6*t) + 0*i
tmin = 0
tmax = 60`
    },
    {
        id: "bio_circadian",
        category: "생명과학",
        name: "Circadian-like (24h)",
        code: `# Circadian (24h)
f(t) = sin(6.283185307179586*t/24) + 0*i
tmin = 0
tmax = 72`
    },

    // --- 지구과학 ---
    {
        id: "geo_seasonal",
        category: "지구과학",
        name: "Seasonal + Trend",
        code: `# Seasonal + Trend
f(t) = 0.02*t + 0.8*sin(6.283185307179586*t/12) + 0*i
tmin = 0
tmax = 120`
    },
    {
        id: "geo_tides",
        category: "지구과학",
        name: "Tides (M2+S2)",
        code: `# Tides (M2+S2)
f(t) = sin(6.283185307179586*t/12.42) + 0.4*sin(6.283185307179586*t/12) + 0*i
tmin = 0
tmax = 72`
    },
    {
        id: "geo_seismic",
        category: "지구과학",
        name: "Seismic wave packet",
        code: `# Seismic packet
f(t) = exp(-0.08*(t-20)*(t-20))*sin(12*t) + 0*i
tmin = 0
tmax = 40`
    },
    {
        id: "geo_multimode",
        category: "지구과학",
        name: "Multi-mode atmosphere-ish",
        code: `# Multi-mode
f(t) = (sin(0.8*t)+0.6*sin(1.1*t)+0.3*sin(1.7*t)) + 0*i
tmin = 0
tmax = 60`
    },
    {
        id: "geo_attenuation",
        category: "지구과학",
        name: "Exponential attenuation",
        code: `# Attenuation (complex)
f(t) = exp(-0.12*t)*(cos(8*t)+i*sin(8*t))
tmin = 0
tmax = 40`
    },
    {
        id: "geo_gyre",
        category: "지구과학",
        name: "Ocean gyre-ish spiral",
        code: `# Gyre spiral
f(t) = exp(-0.02*t)*(cos(t)+i*sin(t))
tmin = 0
tmax = 125.66370614359172`
    },
];
