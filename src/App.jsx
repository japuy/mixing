import { useState, useCallback, useRef, useEffect } from 'react'

const EQ_BANDS_DEFAULT = [
  { id: 1, freq: 25, type: 'Low Cut', gain: 0, q: 1, active: false },
  { id: 2, freq: 52, type: 'Low Shelf', gain: 0, q: 0.7, active: false },
  { id: 3, freq: 78, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 4, freq: 118, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 5, freq: 185, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 6, freq: 325, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 7, freq: 490, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 8, freq: 2200, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 9, freq: 6300, type: 'Bell', gain: 0, q: 1.4, active: false },
  { id: 10, freq: 12700, type: 'High Shelf', gain: 0, q: 0.7, active: false },
]

const formatFreq = (f) => {
  if (f >= 1000) return (f / 1000).toFixed(1).replace('.0', '') + 'k'
  return Math.round(f).toString()
}

const formatTime = (s) => {
  if (!s || isNaN(s)) return '0:00.00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 100)
  return `${m}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

const Slider = ({ label, value, min, max, step = 1, onChange, unit = '', className = '', vertical = false }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    {label && <div className="text-[10px] uppercase tracking-wider text-foreground/60 text-center">{label}</div>}
    <div className={`flex ${vertical ? 'flex-col items-center' : 'items-center gap-2'}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`${vertical ? 'vertical-slider h-32 w-5' : 'flex-1 h-1.5 accent-primary'} cursor-pointer`}
      />
      <div className="text-xs font-mono text-foreground/80 min-w-[50px] text-right">
        {typeof value === 'number' ? (step < 1 ? value.toFixed(1) : Math.round(value)) : value}{unit}
      </div>
    </div>
  </div>
)

const VerticalSlider = ({ value, min, max, step = 1, onChange, unit = '', label, className = '' }) => {
  const range = max - min
  const percent = ((value - min) / range) * 100
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      {label && <div className="text-[10px] uppercase tracking-wider text-foreground/60">{label}</div>}
      <div className="relative h-[180px] w-5 flex items-center justify-center">
        <div className="absolute inset-y-2 w-1 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-primary/60"
            style={{ height: `${percent}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="vertical-slider absolute h-full w-5 opacity-0 cursor-ns-resize"
        />
        <div
          className="absolute w-5 h-3 bg-slate-200 rounded-sm shadow-lg border border-slate-400 pointer-events-none"
          style={{ bottom: `calc(${percent}% - 6px)` }}
        />
      </div>
      <div className="text-[11px] font-mono text-foreground/80">
        {step < 1 ? value.toFixed(1) : Math.round(value)}{unit}
      </div>
    </div>
  )
}

const LockToggle = ({ locked, onChange, label }) => (
  <button
    onClick={() => onChange(!locked)}
    title={label}
    aria-label={label}
    className={`absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full border text-[10px] transition shadow-sm ${
      locked ? 'bg-primary/20 border-primary/50 text-primary' : 'border-slate-600 text-foreground/40 hover:bg-accent'
    }`}
  >
    {locked ? '🔒' : '🔓'}
  </button>
)

const MenuButton = ({ title, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        data-state={open ? 'open' : 'closed'}
        className="rounded-md px-3 py-1.5 text-sm text-foreground/85 hover:bg-accent transition"
      >
        {title}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[220px] rounded-lg border bg-panel shadow-xl p-1 text-sm">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

const MenuItem = ({ label, shortcut, onClick, disabled = false, danger = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition ${
      disabled ? 'text-foreground/30 cursor-not-allowed' : danger ? 'text-rose-400 hover:bg-rose-500/10' : 'hover:bg-accent'
    }`}
  >
    <span>{label}</span>
    {shortcut && <span className="text-[10px] text-foreground/40 font-mono ml-4">{shortcut}</span>}
  </button>
)

const TransportIcon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const EffectButton = ({ label, color, active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`group inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
      active
        ? `bg-[${color}]/10 border-[${color}]/60 text-[${color}] shadow-[0_0_0_1px_${color}22]`
        : 'border-border text-foreground/70 hover:bg-accent hover:text-foreground'
    }`}
    style={active ? {
      backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
      color: color,
    } : {}}
  >
    <span
      className="h-1.5 w-1.5 rounded-full transition"
      style={{ backgroundColor: active ? color : 'currentColor', opacity: active ? 1 : 0.5 }}
    />
    {children || label}
  </button>
)

const ToggleButton = ({ pressed, onToggle, children, className = '' }) => (
  <button
    onClick={onToggle}
    aria-pressed={pressed}
    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
      pressed
        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
        : 'border-border text-foreground/70 hover:bg-accent'
    } ${className}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${pressed ? 'bg-emerald-400' : 'bg-foreground/30'}`} />
    {children}
  </button>
)

const EQPanel = ({ state, setState, selectedBand, setSelectedBand }) => {
  const [bands, setBands] = useState(EQ_BANDS_DEFAULT)
  const updateBand = (id, field, value) => {
    setBands(bands.map(b => b.id === id ? { ...b, [field]: value } : b))
  }
  const selBand = bands.find(b => b.id === selectedBand)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fx-eq)' }}>Parametric EQ</h3>
        <ToggleButton pressed={state.active} onToggle={() => setState({ ...state, active: !state.active })}>Active</ToggleButton>
      </div>

      <div className="flex gap-1 flex-wrap mb-3 pr-2">
        {bands.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBand(b.id)}
            className={`group inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition ${
              selectedBand === b.id
                ? 'bg-primary/10 border-primary/50 text-primary'
                : 'border-border text-foreground/70 hover:bg-accent'
            }`}
          >
            <span className="font-mono font-medium">{formatFreq(b.freq)}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">{b.type}</span>
          </button>
        ))}
        <button className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-foreground/50 hover:bg-accent hover:text-foreground/80 transition">
          + Add band
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-2">
        <div className="flex-1 rounded-lg border bg-panel-soft relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {[-12, -6, 0, 6, 12].map((db) => {
              const y = 50 - (db / 24) * 50
              return (
                <line key={db} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="oklch(30% .01 250)" strokeWidth="1" strokeDasharray="2 4" />
              )
            })}
            {[63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000].map((f, i) => {
              const x = (i / 8) * 100
              return (
                <line key={f} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="oklch(30% .01 250)" strokeWidth="1" strokeDasharray="2 4" />
              )
            })}
            <path
              d="M 0 50% Q 20% 50%, 30% 48% T 50% 52% T 70% 48% T 100% 45%"
              fill="none"
              stroke="var(--fx-eq)"
              strokeWidth="2"
              opacity="0.8"
            />
          </svg>
          {bands.map((b, i) => {
            const x = Math.min(100, Math.max(2, (Math.log10(b.freq) - Math.log10(20)) / (Math.log10(20000) - Math.log10(20)) * 100))
            const y = 50 - ((b.gain || 0) / 24) * 50
            const colors = ['var(--rose-500)', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6']
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBand(b.id)}
                className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full text-[11px] font-bold text-slate-900 transition-transform hover:scale-110 shadow-lg cursor-grab active:cursor-grabbing"
                style={{ left: `${x}%`, top: `${y}%`, backgroundColor: colors[i % colors.length], border: selectedBand === b.id ? '2px solid white' : 'none' }}
              >
                {b.id}
              </button>
            )
          })}
          <div className="absolute top-2 right-2 text-[10px] font-mono text-foreground/40 space-y-1 text-right">
            <div>+12</div><div>+6</div><div>0</div><div>-6</div><div>-12</div>
          </div>
          <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[10px] font-mono text-foreground/40">
            <span>63</span><span>250</span><span>1k</span><span>4k</span><span>16k</span>
          </div>
        </div>

        {selBand && (
          <div className="w-52 rounded-lg border bg-panel p-3 flex flex-col gap-2">
            <div className="text-xs font-semibold text-foreground/80 border-b border-border pb-2 mb-1">
              Band {selBand.id} · {selBand.type}
            </div>
            <Slider label="Frequency (Hz)" value={selBand.freq} min={20} max={20000} step={1}
              onChange={(v) => updateBand(selBand.id, 'freq', v)} />
            <Slider label="Gain (dB)" value={selBand.gain} min={-12} max={12} step={0.1} unit=" dB"
              onChange={(v) => updateBand(selBand.id, 'gain', v)} />
            <Slider label="Q" value={selBand.q} min={0.1} max={10} step={0.1}
              onChange={(v) => updateBand(selBand.id, 'q', v)} />
            <div className="flex gap-2 pt-2">
              <ToggleButton pressed={selBand.active} onToggle={() => updateBand(selBand.id, 'active', !selBand.active)} className="flex-1 justify-center">
                {selBand.active ? 'On' : 'Off'}
              </ToggleButton>
              <button className="flex-1 text-[11px] rounded-md border border-border py-1 text-foreground/60 hover:bg-accent hover:text-rose-400 transition">
                Remove
              </button>
            </div>
          </div>
        )}
        {!selBand && (
          <div className="w-52 rounded-lg border bg-panel p-3 flex items-center justify-center">
            <p className="text-xs text-center text-foreground/50">Select a band — or double-click the graph to add one</p>
          </div>
        )}
      </div>
    </div>
  )
}

const CompressorPanel = ({ state, setState }) => {
  const set = (k, v) => setState({ ...state, [k]: v })
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fx-comp)' }}>Compressor</h3>
        <div className="flex items-center gap-2">
          <button className={`text-[11px] rounded-md border px-2 py-1 transition ${
            state.autoGain ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' : 'border-border text-foreground/70 hover:bg-accent'
          }`} onClick={() => set('autoGain', !state.autoGain)}>Auto Gain</button>
          <ToggleButton pressed={state.active} onToggle={() => set('active', !state.active)}>Active</ToggleButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 rounded-lg border bg-panel-soft relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            {[0, 20, 40, 60, 80, 100].map((p) => (
              <line key={`h${p}`} x1="0" y1={`${100-p}%`} x2="100%" y2={`${100-p}%`} stroke="oklch(30% .01 250)" strokeWidth="1" strokeDasharray="2 4" />
            ))}
            {[0, 20, 40, 60, 80, 100].map((p) => (
              <line key={`v${p}`} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="oklch(30% .01 250)" strokeWidth="1" strokeDasharray="2 4" />
            ))}
            <line x1="0" y1="80%" x2="60%" y2="80%" stroke="var(--fx-comp)" strokeWidth="2" />
            <line x1="60%" y1="80%" x2="100%" y2="30%" stroke="var(--fx-comp)" strokeWidth="2" />
          </svg>
          <div className="absolute top-2 left-2 right-2 flex justify-between text-[10px] font-mono text-foreground/40">
            <span>-40</span><span>-20</span><span>0</span><span>+4</span>
          </div>
          <div className="absolute bottom-2 left-2 text-[10px] font-mono text-foreground/40">
            Input dB
          </div>
          <div className="absolute top-1/2 right-2 -translate-y-1/2 text-[10px] font-mono text-foreground/40 -rotate-90 origin-top-right translate-x-6">
            Output dB
          </div>
          <div className="absolute bottom-3 left-3 text-[11px] text-foreground/70 font-mono">
            <div>drag = threshold · scroll = ratio · handles = knee / ratio</div>
          </div>
        </div>

        <div className="w-64 flex flex-col gap-2">
          <div className="rounded-lg border bg-panel p-2">
            <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">Gain Reduction</div>
            <div className="text-xl font-mono text-emerald-300">−0.0 dB</div>
            <div className="text-[10px] text-foreground/40">GR instantaneous reduction</div>
          </div>
          <Slider label="Threshold" value={state.threshold} min={-60} max={0} step={0.1} unit=" dB" onChange={(v) => set('threshold', v)} />
          <Slider label="Ratio" value={state.ratio} min={1} max={20} step={0.01} unit=" : 1" onChange={(v) => set('ratio', v)} />
          <Slider label="Knee" value={state.knee} min={0} max={40} step={0.5} unit=" dB" onChange={(v) => set('knee', v)} />
          <Slider label="Attack" value={state.attack} min={0.1} max={200} step={0.1} unit=" ms" onChange={(v) => set('attack', v)} />
          <Slider label="Release" value={state.release} min={10} max={2000} step={1} unit=" ms" onChange={(v) => set('release', v)} />
          <Slider label="Makeup" value={state.makeup} min={-12} max={24} step={0.1} unit=" dB" onChange={(v) => set('makeup', v)} />
          <Slider label="Mix" value={state.mix} min={0} max={100} step={1} unit=" %" onChange={(v) => set('mix', v)} />
        </div>
      </div>
    </div>
  )
}

const ColorPanel = ({ state, setState }) => {
  const set = (k, v) => setState({ ...state, [k]: v })
  const bands = state.bands || []
  const setBand = (i, k, v) => {
    const nb = [...bands]; nb[i] = { ...nb[i], [k]: v }; set('bands', nb)
  }
  const bandColors = ['#f97316', '#eab308', '#a855f7', '#22d3ee']
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fx-color)' }}>Color · Harmonic FX</h3>
        <ToggleButton pressed={state.active} onToggle={() => set('active', !state.active)}>Active</ToggleButton>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-y-auto pr-1">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="grid grid-cols-4 gap-2 mb-1">
            {bands.map((b, i) => (
              <button
                key={i}
                className="group rounded-lg border bg-panel p-2 text-left hover:bg-accent transition"
                style={{ borderColor: `${bandColors[i]}55` }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-900" style={{ backgroundColor: bandColors[i] }}>{i + 1}</span>
                  <div className="text-[10px] uppercase tracking-wide text-foreground/60 leading-tight">{b.name}</div>
                </div>
                <div className="text-[11px] font-mono text-foreground/80">{formatFreq(b.freq)} Hz</div>
                <div className="text-[10px] text-foreground/50">{formatFreq(b.low)} – {formatFreq(b.high)} Hz</div>
                <div className="text-[11px] font-mono mt-1" style={{ color: bandColors[i] }}>
                  {b.gain > 0 ? '+' : ''}{b.gain.toFixed(1)} dB · {b.wet}% wet
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-lg border bg-panel-soft h-[140px] relative">
            <svg className="absolute inset-0 w-full h-full">
              {[0, 25, 50, 75, 100].map(p => (
                <line key={p} x1="0" y1={`${100-p}%`} x2="100%" y2={`${100-p}%`} stroke="oklch(30% .01 250)" strokeDasharray="2 4" />
              ))}
              <path d="M 0 70% Q 15% 55%, 25% 60% T 50% 55% T 75% 50% T 100% 30%" fill="none" stroke="var(--fx-color)" strokeWidth="2.5" opacity="0.85" />
            </svg>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {bands.map((b, i) => (
              <div key={i} className="rounded-lg border bg-panel p-2 space-y-2">
                <div className="text-[10px] font-semibold text-foreground/70" style={{ color: bandColors[i] }}>Band {i + 1}</div>
                <Slider value={b.gain} min={-24} max={24} step={0.1} unit=" dB" onChange={(v) => setBand(i, 'gain', v)} />
                <Slider label="Wet" value={b.wet} min={0} max={100} step={1} unit="%" onChange={(v) => setBand(i, 'wet', v)} />
              </div>
            ))}
          </div>
        </div>

        <div className="w-52 flex flex-col gap-2">
          {[
            ['mix', 'Mix', '%', 0, 100],
            ['body', 'Body', '%', 0, 100],
            ['warmth', 'Warmth', '%', 0, 100],
            ['drive', 'Drive', '%', 0, 100],
            ['harmonics', 'Harmonics', '%', 0, 100],
            ['air', 'Air', 'dB', 0, 60],
            ['godParticles', 'God Particles', '%', 0, 100],
            ['stereoMid', 'Stereo Mid', '%', 0, 100],
            ['smartBass', 'Smart Bass', '%', 0, 100],
            ['vocalTickle', 'Vocal Tickle', '%', 0, 100],
            ['vocal2k', 'Vocal 2K', '%', 0, 100],
            ['midProject', 'Mid Project', '%', 0, 100],
            ['aiRepair', 'AI Repair', '%', 0, 100],
            ['output', 'Output', ' dB', -12, 12],
          ].map(([key, label, unit, min, max]) => (
            <Slider key={key} label={label} value={state[key] ?? 0} min={min} max={max} step={key === 'output' || key === 'air' ? 0.1 : 1} unit={unit} onChange={(v) => set(key, v)} />
          ))}
        </div>
      </div>
    </div>
  )
}

const WidthPanel = ({ state, setState }) => {
  const set = (k, v) => setState({ ...state, [k]: v })
  const bands = state.bands || []
  const setBand = (i, k, v) => {
    const nb = [...bands]; nb[i] = { ...nb[i], [k]: v }; set('bands', nb)
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fx-width)' }}>Width</h3>
        <ToggleButton pressed={state.active} onToggle={() => set('active', !state.active)}>Active</ToggleButton>
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 flex flex-col gap-3">
          <div className="rounded-lg border bg-panel p-3 text-[11px] text-foreground/70 space-y-1">
            <div>Space <span className="font-mono text-primary">{state.space}%</span> · Master width</div>
            <div>Parallel mix <span className="font-mono text-foreground/80">{state.mix}%</span> · Crossover <span className="font-mono text-foreground/80">{state.crossover} Hz</span></div>
            <div>Side tone <span className="font-mono text-foreground/80">+{state.sideTone.toFixed(1)} dB</span></div>
            <div className="flex gap-4 pt-1">
              <div>Correlation <span className="font-mono text-emerald-300">+ 0.00</span></div>
              <div>Wide -1 <span className="text-foreground/40">0</span> +1</div>
              <div>Side level <span className="font-mono">-∞ dB</span></div>
              <div>Phase score <span className="font-mono">0%</span></div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {bands.map((b, i) => (
              <div key={i} className="rounded-lg border bg-panel p-2">
                <div className="text-[11px] font-semibold mb-2">{b.name}</div>
                <div className="text-[10px] text-foreground/50 mb-2">{b.range}</div>
                <VerticalSlider value={b.width} min={0} max={200} step={1} unit="%" />
                <div className="text-[10px] text-center text-foreground/50 mt-1">{b.mode}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-52 flex flex-col gap-2">
          <Slider label="Mix" value={state.mix} min={0} max={100} step={1} unit="%" onChange={(v) => set('mix', v)} />
          <Slider label="Space" value={state.space} min={0} max={200} step={1} unit="%" onChange={(v) => set('space', v)} />
          {bands.map((b, i) => (
            <Slider key={i} label={b.name.split(' ')[0]} value={b.width} min={0} max={200} step={1} unit="%" onChange={(v) => setBand(i, 'width', v)} />
          ))}
          <Slider label="Side Tone" value={state.sideTone} min={-12} max={12} step={0.1} unit=" dB" onChange={(v) => set('sideTone', v)} />
          <Slider label="Protect" value={state.protect} min={0} max={100} step={1} unit="%" onChange={(v) => set('protect', v)} />
          <Slider label="Crossover" value={state.crossover} min={50} max={500} step={1} unit=" Hz" onChange={(v) => set('crossover', v)} />
        </div>
      </div>
    </div>
  )
}

const LimiterPanel = ({ state, setState }) => {
  const set = (k, v) => setState({ ...state, [k]: v })
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--fx-limiter)' }}>Limiter</h3>
        <div className="flex items-center gap-2">
          <button className={`text-[11px] rounded-md border px-2 py-1 transition ${
            state.tpSafe ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'border-border text-foreground/70 hover:bg-accent'
          }`} onClick={() => set('tpSafe', !state.tpSafe)}>TP Safe</button>
          <button className={`text-[11px] rounded-md border px-2 py-1 transition ${
            state.oversample ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'border-border text-foreground/70 hover:bg-accent'
          }`} onClick={() => set('oversample', !state.oversample)}>
            {state.oversample ? '4 x' : '1 x'}
          </button>
          <ToggleButton pressed={state.active} onToggle={() => set('active', !state.active)}>Active</ToggleButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-3">
        <div className="flex-1 flex flex-col gap-3">
          <div className="rounded-lg border bg-panel-soft h-[220px] relative overflow-hidden">
            <div className="absolute top-2 left-2 text-[11px] font-mono text-foreground/70">
              Output Meter · <span className="text-emerald-300">-36.0 dB pk</span> · <span className="text-rose-300">−0.0 dB GR</span>
            </div>
            <div className="absolute bottom-2 left-3 right-3 h-6 flex gap-[2px] items-end">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 via-emerald-400 to-amber-300" style={{ height: `${Math.max(5, 20 + Math.sin(i * 0.5) * 10 + Math.random() * 30)}%`, opacity: 0.7 + Math.random() * 0.3 }} />
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="0" y1="15%" x2="100%" y2="15%" stroke="oklch(72% .16 25 / 0.4)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="8" y="14%" fill="oklch(72% .16 25)" fontSize="10" fontFamily="monospace">Ceiling {state.ceiling.toFixed(1)} dB</text>
            </svg>
            <div className="absolute bottom-10 left-3 text-[11px] text-foreground/60">
              Ceiling <span className="font-mono">{state.ceiling.toFixed(1)} dB</span> · Gain <span className="font-mono text-amber-300">+{state.gain.toFixed(1)} dB</span> · Peak Guard <span className="font-mono">{state.peakGuard.toFixed(1)} ms</span> · True-Peak Safe
            </div>
          </div>

          <div className="text-[11px] italic text-foreground/50 pl-2">
            💡 Hint: Drag display vertically = gain · scroll = ceiling. Pick a Style pill for tonal character.
          </div>
        </div>

        <div className="w-52 flex flex-col gap-2">
          <Slider label="Gain" value={state.gain} min={-12} max={24} step={0.1} unit=" dB" onChange={(v) => set('gain', v)} />
          <Slider label="Ceiling" value={state.ceiling} min={-3} max={0} step={0.1} unit=" dB" onChange={(v) => set('ceiling', v)} />
          <Slider label="Peak Guard" value={state.peakGuard} min={0} max={20} step={0.1} unit=" ms" onChange={(v) => set('peakGuard', v)} />
          <Slider label="Attack" value={state.attack} min={0.1} max={30} step={0.1} unit=" ms" onChange={(v) => set('attack', v)} />
          <Slider label="Release" value={state.release} min={10} max={1000} step={1} unit=" ms" onChange={(v) => set('release', v)} />
          <Slider label="Transients" value={state.transients} min={0} max={100} step={1} unit="%" onChange={(v) => set('transients', v)} />
          <Slider label="Release Link" value={state.releaseLink} min={0} max={100} step={1} unit="%" onChange={(v) => set('releaseLink', v)} />
        </div>
      </div>
    </div>
  )
}

const IOPanel = ({ io, setIo }) => (
  <div className="rounded-xl border bg-panel p-3 h-full flex flex-col relative">
    <LockToggle locked={io.outputLocked} onChange={(v) => setIo({ ...io, outputLocked: v })} label="Lock Output gain when loading presets" />
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-semibold text-foreground/80 tracking-wide">I / O</div>
      <ToggleButton pressed={io.active} onToggle={() => setIo({ ...io, active: !io.active })}>ACTIVE</ToggleButton>
    </div>

    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 flex-1 min-h-0">
      <div className="flex flex-col">
        <div className="text-[11px] uppercase tracking-wider text-foreground/50 text-center mb-2">Input</div>
        <div className="text-[10px] font-mono text-foreground/50 text-center mb-1 flex justify-around">
          <span>peak</span><span>·</span><span>rms</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-center mb-1">
          <div className="text-foreground/40">-∞ / -∞</div>
          <div className="text-foreground/40">-∞ / -∞</div>
        </div>
        <div className="flex-1 min-h-0 flex items-start justify-center">
          <VerticalSlider value={io.inputGain} min={-24} max={18} step={0.1} unit=" dB" onChange={(v) => setIo({ ...io, inputGain: v })} />
        </div>
      </div>

      <div className="flex flex-col items-center justify-between py-2 text-[10px] font-mono text-foreground/40">
        <div>4</div><div>0</div><div>-1</div><div>-3</div><div>-6</div>
        <div>-10</div><div>-15</div><div>-20</div><div>-30</div><div>-40</div><div>-50</div><div>∞</div>
      </div>

      <div className="flex flex-col">
        <div className="text-[11px] uppercase tracking-wider text-foreground/50 text-center mb-2">Output</div>
        <div className="text-[10px] font-mono text-foreground/50 text-center mb-1 flex justify-around">
          <span>peak</span><span>·</span><span>rms</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-center mb-1">
          <div className="text-foreground/40">-∞ / -∞</div>
          <div className="text-foreground/40">-∞ / -∞</div>
        </div>
        <div className="flex-1 min-h-0 flex items-start justify-center">
          <VerticalSlider value={io.outputGain} min={-24} max={18} step={0.1} unit=" dB" onChange={(v) => setIo({ ...io, outputGain: v })} />
        </div>
        {io.outputLocked && <div className="text-[10px] font-mono text-primary/80 text-center mt-1">Output locked</div>}
      </div>
    </div>

    <div className="mt-3 space-y-2">
      <div className="relative">
        <LockToggle locked={io.bypassLocked} onChange={(v) => setIo({ ...io, bypassLocked: v })} label="Lock Bypass state when loading presets" />
        <button
          onClick={() => setIo({ ...io, bypass: !io.bypass })}
          className={`grid min-h-[50px] w-full place-items-center rounded-md border px-3 py-2 pr-8 text-xs font-medium transition ${
            io.bypass ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'border-border text-foreground/80 hover:bg-accent'
          }`}
        >
          {io.bypass ? 'Bypass · ON' : 'Bypass'}
        </button>
      </div>
      <div className="relative">
        <LockToggle locked={io.gainMatchLocked} onChange={(v) => setIo({ ...io, gainMatchLocked: v })} label="Lock Gain Match state when loading presets" />
        <button
          onClick={() => setIo({ ...io, gainMatch: !io.gainMatch })}
          className={`grid min-h-[50px] w-full place-items-center rounded-md border px-3 py-2 pr-8 text-xs font-medium transition ${
            io.gainMatch ? 'bg-sky-500/10 border-sky-500/40 text-sky-300' : 'border-border text-foreground/80 hover:bg-accent'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Gain Match</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${io.gainMatch ? 'bg-sky-500/30' : 'bg-slate-700/50'}`}>
              {io.gainMatch ? 'On' : 'Off'}
            </span>
          </div>
        </button>
      </div>
    </div>
  </div>
)

export default function App() {
  const fileInputRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [monitorVolume, setMonitorVolume] = useState(100)
  const [audioDevice, setAudioDevice] = useState('default')
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [fileName, setFileName] = useState('')

  const [activeTab, setActiveTab] = useState('eq')
  const [compareSel, setCompareSel] = useState('a')
  const [selectedBand, setSelectedBand] = useState(1)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  const [io, setIo] = useState({
    active: true,
    inputGain: 0,
    outputGain: 0,
    outputLocked: true,
    bypass: false,
    bypassLocked: false,
    gainMatch: false,
    gainMatchLocked: false,
  })

  const [eqState, setEqState] = useState({ active: true })
  const [compState, setCompState] = useState({
    active: true, autoGain: false,
    threshold: -24.4, ratio: 1.7, knee: 24,
    attack: 32, release: 210, makeup: 0.7, mix: 88,
  })
  const [colorState, setColorState] = useState({
    active: true,
    bands: [
      { name: 'Lower Body', freq: 166, low: 95, high: 260, gain: 12.8, wet: 12 },
      { name: 'Vocal Body', freq: 500, low: 160, high: 650, gain: 12.8, wet: 13 },
      { name: 'High-Mid Harmonics', freq: 2180, low: 600, high: 3500, gain: 2.9, wet: 4 },
      { name: 'High Air', freq: 12700, low: 6500, high: 16000, gain: 42, wet: 12 },
    ],
    mix: 31, body: 92, warmth: 70, drive: 55, harmonics: 67, air: 42,
    godParticles: 92, stereoMid: 70, smartBass: 55, vocalTickle: 67,
    vocal2k: 55, midProject: 65, aiRepair: 46, output: 0,
  })
  const [widthState, setWidthState] = useState({
    active: true,
    mix: 55, space: 126, sideTone: 1.2, protect: 96, crossover: 150,
    bands: [
      { name: 'Sub / Low', range: '20 Hz – mono', width: 100, mode: 'natural' },
      { name: 'Low‑Mid', range: '120 Hz – 600 Hz', width: 101, mode: 'natural' },
      { name: 'Mid Image', range: '600 Hz – 3.5 kHz', width: 114, mode: 'natural' },
      { name: 'High Air', range: '3.5 kHz – 20 kHz', width: 146, mode: 'wide' },
    ],
  })
  const [limiterState, setLimiterState] = useState({
    active: true, tpSafe: true, oversample: true,
    gain: 0.6, ceiling: -1.0, peakGuard: 5.0,
    attack: 4.2, release: 104, transients: 70, releaseLink: 92,
  })

  const handleFileOpen = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setAudioLoaded(true)
      setDuration(185.42)
      setCurrentTime(0)
    }
  }, [])

  const triggerOpen = () => fileInputRef.current?.click()

  const togglePlay = () => {
    if (!audioLoaded) return
    setIsPlaying(p => !p)
  }

  useEffect(() => {
    let t
    if (isPlaying && duration > 0) {
      t = setInterval(() => {
        setCurrentTime(ct => {
          const next = ct + 0.05
          if (loop && next >= duration) return 0
          if (next >= duration) { setIsPlaying(false); return duration }
          return next
        })
      }, 50)
    }
    return () => clearInterval(t)
  }, [isPlaying, duration, loop])

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [audioLoaded])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileOpen} className="hidden" />

      <header className="h-12 shrink-0 flex items-center px-3 gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 mr-4 pr-4 border-r" style={{ borderColor: 'var(--border)' }}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-cyan-400 grid place-items-center shadow-lg shadow-cyan-500/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div>
            <div className="text-base font-bold tracking-tight leading-none">MaSonKuPik</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-foreground/50 leading-tight mt-0.5">Online Mastering</div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <MenuButton title="File">
            <MenuItem label="Open Audio…" shortcut="Ctrl+O" onClick={triggerOpen} />
            <MenuItem label="Open Audio (New Tab)" shortcut="Ctrl+Shift+O" />
            <MenuItem label="Import Audio URL…" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Export Master → WAV" shortcut="Ctrl+E" disabled={!audioLoaded} />
            <MenuItem label="Export Master → MP3" shortcut="Ctrl+Shift+E" disabled={!audioLoaded} />
            <MenuItem label="Export Stems" disabled={!audioLoaded} />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Share Project Link…" />
            <MenuItem label="Close Project" disabled={!audioLoaded} danger />
          </MenuButton>
          <MenuButton title="Edit">
            <MenuItem label="Undo" shortcut="Ctrl+Z" disabled={undoStack.length === 0} />
            <MenuItem label="Redo" shortcut="Ctrl+Y" disabled={redoStack.length === 0} />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Reset All FX" />
            <MenuItem label="Reset Gain Staging" />
            <MenuItem label="Invert Phase" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Select All" shortcut="Ctrl+A" />
            <MenuItem label="Select None" />
          </MenuButton>
          <MenuButton title="Settings">
            <MenuItem label="Audio Device" />
            <MenuItem label="Buffer Size → 512 samples" />
            <MenuItem label="Sample Rate → 48 kHz" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Theme: Dark" />
            <MenuItem label="Meter Style: Peak + RMS" />
            <MenuItem label="VU Calibration: -18 dBFS" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Keyboard Shortcuts…" shortcut="?" />
          </MenuButton>
          <MenuButton title="Preset">
            <MenuItem label="💎 Mastering (Default)" />
            <MenuItem label="🎸 Rock & Metal" />
            <MenuItem label="🎹 EDM & Club" />
            <MenuItem label="🎤 Pop & Vocal" />
            <MenuItem label="🎧 LoFi & Chill" />
            <MenuItem label="🎻 Orchestral & Film" />
            <MenuItem label="📢 Podcast & Voice" />
            <MenuItem label="🎺 Jazz & Acoustic" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Save Preset As…" shortcut="Ctrl+S" />
            <MenuItem label="Import Preset…" />
            <MenuItem label="Export Current Preset" />
            <MenuItem label="Manage Presets…" />
          </MenuButton>
          <MenuButton title="Help">
            <MenuItem label="Quick Start Guide" />
            <MenuItem label="FX Reference Manual" />
            <MenuItem label="Video Tutorials" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="Tips & Best Practices" />
            <MenuItem label="Troubleshooting Audio" />
            <MenuItem label="Supported File Types" />
            <div className="h-px bg-border my-1" />
            <MenuItem label="About MaSonKuPik Studio" />
            <MenuItem label="Report a Bug…" />
            <MenuItem label="Feature Request…" />
          </MenuButton>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[11px] text-foreground/60">
          <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_var(--fx-eq)]" />
          <span>{audioLoaded ? fileName.replace(/\.[^.]+$/, '') : 'No audio loaded'} · Universal</span>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col p-3 gap-3 max-w-[1400px] mx-auto w-full">
        {!audioLoaded && (
          <section className="rounded-2xl border bg-gradient-to-b from-panel to-panel-soft p-6 text-center shadow-xl">
            <div className="text-[11px] uppercase tracking-[0.25em] text-cyan-300/80 mb-3 font-medium">Fast Mastering</div>
            <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-5 max-w-2xl mx-auto">
              Open one audio file. The <span className="text-cyan-300">Mastering</span> preset is already ready.
            </h2>
            <button
              onClick={triggerOpen}
              className="h-12 inline-flex items-center gap-2 rounded-xl px-7 text-base font-semibold transition shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              Open Audio
            </button>
            <div className="mt-5 text-sm text-foreground/50 flex items-center justify-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs grid place-items-center font-semibold">1</span>Open audio</span>
              <span className="text-foreground/30">→</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs grid place-items-center font-semibold">2</span>Play and compare</span>
              <span className="text-foreground/30">→</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs grid place-items-center font-semibold">3</span>Export</span>
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-panel p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button title="Skip to start" onClick={() => setCurrentTime(0)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition hover:bg-accent text-foreground/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <button
              title="Play / Pause (Space)"
              onClick={togglePlay}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition shadow-md"
              style={{ backgroundColor: isPlaying ? 'color-mix(in oklab, var(--primary) 85%, black)' : 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3" /></svg>
              )}
            </button>
            <button title="Stop" onClick={() => { setIsPlaying(false); setCurrentTime(0) }} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition hover:bg-accent text-foreground/80">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" /></svg>
            </button>
            <button title="Skip to end" onClick={() => setCurrentTime(duration)} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent transition hover:bg-accent text-foreground/80">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" /></svg>
            </button>
            <button
              title="Loop"
              onClick={() => setLoop(l => !l)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${loop ? 'bg-primary/15 border-primary/40 text-primary' : 'border-transparent text-foreground/80 hover:bg-accent'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </button>
          </div>

          <div className="flex-1 min-w-[200px] flex items-center gap-3">
            <div className="font-mono text-sm tabular-nums text-foreground/85 min-w-[130px] text-center">
              {formatTime(currentTime)} <span className="text-foreground/40">/</span> {formatTime(duration)}
            </div>
            <div className="flex-1 relative h-2 rounded-full bg-slate-800 overflow-hidden cursor-pointer group"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                const p = (e.clientX - r.left) / r.width
                setCurrentTime(Math.max(0, Math.min(duration, p * duration)))
              }}>
              <div className="absolute inset-y-0 left-0 bg-primary/60" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} />
              {duration > 0 && (
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition"
                  style={{ left: `calc(${(currentTime / duration) * 100}% - 6px)` }} />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/60">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              <input type="range" min="0" max="125" value={monitorVolume} onChange={(e) => setMonitorVolume(parseInt(e.target.value))}
                className="h-1.5 w-28 accent-primary" />
              <div className="font-mono text-xs text-foreground/70 min-w-[45px] text-right">{monitorVolume} %</div>
            </div>

            <select
              value={audioDevice}
              onChange={(e) => setAudioDevice(e.target.value)}
              aria-label="Audio output device"
              className="text-xs rounded-md border border-border bg-background px-2 py-1 text-foreground/80 outline-none focus:border-primary/50"
            >
              <option value="default">Default output</option>
              <option value="communications">Communications - Speakers</option>
              <option value="speakers">Speakers (High Definition)</option>
            </select>
          </div>
        </section>

        <section className="flex-1 min-h-0 grid grid-cols-[1fr_340px] gap-3">
          <div className="rounded-xl border bg-panel p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">Chain</div>
              <button
                title="Undo"
                disabled={undoStack.length === 0}
                className="grid h-7 w-7 place-items-center rounded-md border border-border text-foreground/70 transition hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13" />
                </svg>
              </button>
              <button
                title="Redo"
                disabled={redoStack.length === 0}
                className="grid h-7 w-7 place-items-center rounded-md border border-border text-foreground/70 transition hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 13" />
                </svg>
              </button>

              <div className="h-5 w-px bg-border mx-1" />

              <div className="flex gap-1.5">
                <EffectButton label="EQ" color="var(--fx-eq)" active={activeTab === 'eq'} onClick={() => setActiveTab('eq')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
                  EQ
                </EffectButton>
                <EffectButton label="Compressor" color="var(--fx-comp)" active={activeTab === 'comp'} onClick={() => setActiveTab('comp')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M2 12h2l3-9h4l3 18h4l3-9h3" /></svg>
                  Compressor
                </EffectButton>
                <EffectButton label="Color" color="var(--fx-color)" active={activeTab === 'color'} onClick={() => setActiveTab('color')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.6 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-8.8-10-8.8z" /></svg>
                  Color
                </EffectButton>
                <EffectButton label="Width" color="var(--fx-width)" active={activeTab === 'width'} onClick={() => setActiveTab('width')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M18 8l4 4-4 4M6 8l-4 4 4 4" /></svg>
                  Width
                </EffectButton>
                <EffectButton label="Limiter" color="var(--fx-limiter)" active={activeTab === 'limiter'} onClick={() => setActiveTab('limiter')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                  Limiter
                </EffectButton>
              </div>

              <div className="h-5 w-px bg-border mx-auto ml-auto" />

              <div className="flex items-center gap-1.5 pl-1">
                <div className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold mr-1">Compare</div>
                <button onClick={() => setCompareSel('a')} className={`h-7 w-7 rounded-md border text-xs font-bold transition ${compareSel === 'a' ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border text-foreground/70 hover:bg-accent'}`}>A</button>
                <button onClick={() => setCompareSel('b')} className={`h-7 w-7 rounded-md border text-xs font-bold transition ${compareSel === 'b' ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border text-foreground/70 hover:bg-accent'}`}>B</button>
                <button title="Copy A → B" className="ml-1 rounded-md border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-foreground/60 hover:bg-accent hover:text-foreground transition">Copy →</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {activeTab === 'eq' && <EQPanel state={eqState} setState={setEqState} selectedBand={selectedBand} setSelectedBand={setSelectedBand} />}
              {activeTab === 'comp' && <CompressorPanel state={compState} setState={setCompState} />}
              {activeTab === 'color' && <ColorPanel state={colorState} setState={setColorState} />}
              {activeTab === 'width' && <WidthPanel state={widthState} setState={setWidthState} />}
              {activeTab === 'limiter' && <LimiterPanel state={limiterState} setState={setLimiterState} />}
            </div>
          </div>

          <IOPanel io={io} setIo={setIo} />
        </section>

        <footer className="rounded-xl border bg-panel/60 p-3 flex items-center justify-between text-[11px] text-foreground/50 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Processing locally · your audio never leaves this browser
            </span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="text-cyan-300/80 hover:text-cyan-300 transition flex items-center gap-1" onClick={triggerOpen}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Add to Chat
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="text-foreground/50">
              <span className="text-foreground/70 font-medium">Dukung pengembangan independen</span>
              <div className="flex gap-2 mt-1 items-center">
                <button className="text-[10px] text-amber-300 hover:text-amber-200 underline underline-offset-2">Perbesar QRIS</button>
                <span className="text-foreground/40">·</span>
                <span className="text-[10px]">Nominal bebas. Dukungan tidak memengaruhi akses fitur.</span>
              </div>
            </div>
          </div>
        </footer>
      </main>

      <div aria-label="Notifications alt+T" className="fixed bottom-4 right-4 z-[60] space-y-2" />
    </div>
  )
}
