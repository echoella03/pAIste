import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import API from '../api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const C = {
  darkGreen: '#0D3A24', midGreen: '#1C6E0B', lightGreen: '#36AD42',
  sage: '#466958', bgCream: '#FCFDE7', bgLight: '#D9E2D8',
  bgLight50: 'rgba(217,226,216,0.5)', muted: '#A4AD7E',
  white: '#FFFFFF', red: '#CA0000', darkRed: '#411414',
  orange: '#D97524', darkOrange: '#934F18',
  yellow: '#EEFF00', darkYellow: '#7E9C12',
  cardGreen: '#A7C5A4', boxCol: '#caedc7'
}

const threatColor = { critical: '#CA0000', high: '#D97524', moderate: '#cfc427', low: '#1C6E0B' }
const threatBorder = { critical: '#411414', high: '#934F18', moderate: '#9b931e', low: '#134B07' }
const threatNumColor = { critical: '#ffffff', high: '#ffffff', moderate: '#ffffff', low: '#ffffff' }
const threatLblColor = { critical: '#411414', high: '#3A1B0D', moderate: '#333f07', low: '#FCFDE7' }

const CARD_HEIGHT = '295px';

const createThreatIcon = (level, big = false) => L.divIcon({
  className: '',
  html: `<div style="background:${threatColor[level] || C.lightGreen};width:${big ? 18 : 11}px;height:${big ? 18 : 11}px;border-radius:50%;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: big ? [18, 18] : [11, 11], iconAnchor: big ? [9, 9] : [5.5, 5.5],
})

function MapFly({ center }) {
  const map = useMap()
  useEffect(() => { if (center) map.flyTo(center, 11, { duration: 1.2 }) }, [center])
  return null
}

function KPIBox({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl relative transition-all duration-300 w-full"
      style={{
        backgroundColor: C.bgLight50,
        borderBottom: `6px solid ${C.darkGreen}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '16px 8px 12px',
        minHeight: '100px',
      }}>
      <p className="font-nerko leading-none text-center transition-all duration-300"
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          color: '#CED5BF',
          WebkitTextStroke: `clamp(2px,0.5vw,4px) ${C.darkGreen}`,
          paintOrder: 'stroke fill',
        }}>
        {value}
      </p>
      <p className="font-londrina tracking-widest text-center mt-1"
        style={{ color: C.darkGreen, fontSize: '12px' }}>
        {label}
      </p>
    </div>
  )
}

function MCTSBox({ value, label, level, isActive, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${isActive ? 'scale-105 shadow-lg z-10' : 'hover:scale-105 hover:shadow-md'}`}
      style={{
        backgroundColor: isActive ? threatColor[level] : `${threatColor[level]}99`, 
        borderBottom: `5px solid ${threatBorder[level]}`,
        border: isActive ? `2px solid ${C.white}` : '2px solid transparent',
        padding: '8px 4px 6px',
        minHeight: '72px',
        opacity: isActive ? 1 : 0.65
      }}>
      <p className="font-nerko leading-none transition-all duration-300"
        style={{
          fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
          color: threatNumColor[level],
          WebkitTextStroke: `2px ${threatBorder[level]}`,
          paintOrder: 'stroke fill',
        }}>
        {value}
      </p>
      <p className="font-londrina tracking-widest text-center mt-0.5"
        style={{ color: threatLblColor[level], fontSize: '10px' }}>
        {label}
      </p>
    </div>
  )
}

function DonutChart({ data }) {
  const [active, setActive] = useState(null); 
  
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="font-manjari text-xs text-center py-4" style={{ color: C.sage }}>No data yet</p>
  
  let cum = 0
  const cx = 50, cy = 50, r = 45, inn = 28
  const toR = a => a * Math.PI / 180
  
  const slices = data.map(d => {
    const pct = d.value / total
    const sa = cum * 360 - 90
    const ea = (cum + pct) * 360 - 90
    const large = pct > 0.5 ? 1 : 0
    
    const midA = toR(sa + (ea - sa) / 2)
    cum += pct
    
    const pts = [
      cx + r * Math.cos(toR(sa)), cy + r * Math.sin(toR(sa)), 
      cx + r * Math.cos(toR(ea)), cy + r * Math.sin(toR(ea)),
      cx + inn * Math.cos(toR(ea)), cy + inn * Math.sin(toR(ea)), 
      cx + inn * Math.cos(toR(sa)), cy + inn * Math.sin(toR(sa))
    ]
    
    const isActive = active === d.label;
    const offset = isActive ? 5 : 0; 
    const tx = Math.cos(midA) * offset;
    const ty = Math.sin(midA) * offset;

    const path = `M ${pts[0]} ${pts[1]} A ${r} ${r} 0 ${large} 1 ${pts[2]} ${pts[3]} L ${pts[4]} ${pts[5]} A ${inn} ${inn} 0 ${large} 0 ${pts[6]} ${pts[7]} Z`
    
    return { ...d, pct, isActive, path, tx, ty }
  })

  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-2">
      <div className="relative w-full flex justify-center">
        <svg viewBox="-10 -10 120 120" className="w-36 h-36 lg:w-44 lg:h-44 flex-shrink-0 overflow-visible">
          {slices.map((s, i) => (
            <path 
              key={i} 
              d={s.path} 
              fill={s.color} 
              stroke={C.white} 
              strokeWidth="1.5" 
              opacity={active ? (s.isActive ? 1 : 0.25) : 1} 
              transform={`translate(${s.tx}, ${s.ty})`}
              style={{ transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', cursor: 'pointer' }}
              onClick={() => setActive(s.isActive ? null : s.label)}
              onMouseEnter={(e) => { e.target.style.filter = 'brightness(1.1)' }}
              onMouseLeave={(e) => { e.target.style.filter = 'none' }}
            />
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="14" fontWeight="bold" fontFamily="Nerko One,cursive" fill={C.darkGreen} style={{ pointerEvents: 'none' }}>
            {active ? data.find(d => d.label === active)?.value : total}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize="8" fontFamily="Londrina Solid,sans-serif" fill={C.sage} style={{ pointerEvents: 'none' }}>
            {active ? active.toUpperCase() : 'REPORTS'}
          </text>
        </svg>
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2 mt-1">
        {slices.map((s, i) => (
          <div 
            key={i} 
            className="flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
            onClick={() => setActive(s.isActive ? null : s.label)}
            style={{ opacity: active ? (s.isActive ? 1 : 0.4) : 1 }}
          >
            <div className="w-3 h-3 rounded-sm flex-shrink-0 shadow-sm" style={{ backgroundColor: s.color }} />
            <span className="font-manjari text-[11px] font-bold tracking-wide uppercase" style={{ color: C.darkGreen }}>{s.label}</span>
            <span className="font-nerko ml-0.5" style={{ fontSize: '12px', color: C.darkGreen }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendChart({ data, activeLevel, setActiveLevel, onDotClick, selectedMonth }) {
  const [hover, setHover] = useState(null);

  const levels = ['critical', 'high', 'moderate', 'low'];
  const colors = { critical: C.red, high: C.orange, moderate: C.yellow, low: C.lightGreen };
  
  if (!data || data.length === 0) return <p className="font-manjari text-xs py-4 text-center" style={{ color: C.sage }}>No trend data yet</p>;
  
  const W = 1000, H = 270, pL = 25, pR = 15, pT = 15, pB = 25;
  const cW = W - pL - pR, cH = H - pT - pB;
  
  const maxVal = Math.max(1, ...levels.flatMap(l => data.map(d => d[l] || 0)));
  const xP = i => pL + (i / Math.max(data.length - 1, 1)) * cW;
  const yP = v => pT + cH - (v / maxVal) * cH;
  const yTicks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  const getSmoothPath = (levelKey) => {
    if (data.length === 0) return '';
    let path = `M ${xP(0)},${yP(data[0][levelKey] || 0)}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = xP(i);
      const y0 = yP(data[i][levelKey] || 0);
      const x1 = xP(i + 1);
      const y1 = yP(data[i+1][levelKey] || 0);
      
      const cpX = x0 + (x1 - x0) / 2;
      path += ` C ${cpX},${y0} ${cpX},${y1} ${x1},${y1}`;
    }
    return path;
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex mb-2 flex-shrink-0">
        <div className="flex bg-white/40 p-1 rounded-lg border border-white/50 shadow-sm gap-1">
          <button 
            onClick={() => setActiveLevel('all')} 
            className={`font-londrina text-[10px] px-3 py-1 rounded-md tracking-wider transition-all ${activeLevel === 'all' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
            style={activeLevel === 'all' ? { backgroundColor: C.darkGreen, color: C.white } : { color: C.darkGreen }}
          >
            ALL
          </button>
          {levels.map(l => (
            <button 
              key={l} 
              onClick={() => setActiveLevel(activeLevel === l ? 'all' : l)} 
              className={`font-londrina text-[10px] px-3 py-1 rounded-md tracking-wider transition-all uppercase ${activeLevel === l ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
              style={activeLevel === l 
                ? { backgroundColor: colors[l], color: l === 'moderate' ? C.darkGreen : C.white } 
                : { color: l === 'moderate' ? '#9b931e' : colors[l] } 
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 w-full relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
          
          {/* Gradients to fade the areas smoothly toward the bottom */}
          <defs>
            {levels.map(l => (
              <linearGradient key={`grad-${l}`} id={`grad-${l}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[l]} stopOpacity="0.6" />
                <stop offset="100%" stopColor={colors[l]} stopOpacity="0.05" />
              </linearGradient>
            ))}
          </defs>

          {yTicks.map((t, i) => (
            <g key={`y-${i}`}>
              <line x1={pL} y1={yP(t)} x2={W - pR} y2={yP(t)} stroke={C.bgLight} strokeWidth="1.5" strokeDasharray="4 4" />
              <text x={pL - 6} y={yP(t) + 3} textAnchor="end" fontSize="20" fill={C.sage} fontFamily="Londrina Solid">{t}</text>
            </g>
          ))}
          
          {data.map((d, i) => (
            <text key={`x-${i}`} x={xP(i)} y={yP(0) + 18} textAnchor="middle" fontSize="16" fill={C.sage} fontFamily="Londrina Solid">{d.label}</text>
          ))}
          
          {levels.map(level => {
            const visible = activeLevel === 'all' || activeLevel === level;
            const opacity = visible ? 1 : 0.15; 
            
            const linePathStr = getSmoothPath(level);
            
            const areaPathStr = `${linePathStr} L ${xP(data.length - 1)},${yP(0)} L ${xP(0)},${yP(0)} Z`;

            return (
              <g key={level} opacity={opacity} style={{transition: 'opacity 0.3s ease'}}>
                
                {/* The Filled Gradient Area */}
                <path d={areaPathStr} fill={`url(#grad-${level})`} style={{transition: 'all 0.5s ease'}} />
                
                {/* The Smooth Top Line */}
                <path d={linePathStr} fill="none" stroke={colors[level]} strokeWidth={activeLevel === level ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" style={{transition: 'all 0.5s ease'}} />
                
                {data.map((d, i) => {
                  const cx = xP(i);
                  const cy = yP(d[level] || 0);
                  const val = d[level] || 0;
                  
                  const isSelected = selectedMonth === d.label && (activeLevel === level || activeLevel === 'all');

                  return (
                    <circle 
                      key={i} 
                      cx={cx} 
                      cy={cy} 
                      r={isSelected ? 5.5 : (activeLevel === level ? 4.5 : 3.5)} 
                      fill={colors[level]} 
                      stroke={isSelected ? C.darkGreen : "white"} 
                      strokeWidth={isSelected ? "2" : "1.5"} 
                      className="cursor-pointer transition-all hover:r-6" 
                      style={{transition: 'all 0.3s ease', filter: isSelected ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))' : 'none'}}
                      onMouseEnter={() => setHover({ cx, cy, val, level: level.toUpperCase(), month: d.label })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onDotClick(d.label, level)}
                    />
                  )
                })}
              </g>
            )
          })}
          
          {hover && (
            <g transform={`translate(${hover.cx}, ${hover.cy - 12})`} className="pointer-events-none transition-all z-50">
              <rect x="-60" y="-42" width="120" height="40" rx="4" fill={C.darkGreen} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))" />
              <polygon points="-5,-3 5,-3 0,2" fill={C.darkGreen} />
              <text x="0" y="-25" textAnchor="middle" fontSize="15" fill={C.bgLight} fontFamily="Londrina Solid tracking-widest">{hover.month} - {hover.level}</text>
              <text x="0" y="-8" textAnchor="middle" fontSize="15" fill="white" fontFamily="Nerko One">{hover.val} Reports</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

function SpeciesTreemap({ data, selectedSpecies, setSelectedSpecies }) {
  const chartData = [...data].filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  
  if (chartData.length === 0) {
    return <p className="font-manjari text-xs py-4 text-center" style={{ color: C.sage }}>No species data yet</p>;
  }

  function buildTreemap(items, x, y, w, h) {
    if (items.length === 0) return [];
    if (items.length === 1) return [{ ...items[0], x, y, w, h }];

    let total = items.reduce((sum, d) => sum + d.count, 0);
    let halfSum = 0;
    let splitIndex = 0;
    
    for (let i = 0; i < items.length; i++) {
      halfSum += items[i].count;
      if (halfSum >= total / 2) {
        let prevDiff = i > 0 ? Math.abs((halfSum - items[i].count) - (total / 2)) : Infinity;
        let currDiff = Math.abs(halfSum - (total / 2));
        splitIndex = prevDiff < currDiff ? i : i + 1;
        break;
      }
    }
    
    if (splitIndex === 0) splitIndex = 1;
    if (splitIndex === items.length) splitIndex = items.length - 1;

    let leftData = items.slice(0, splitIndex);
    let rightData = items.slice(splitIndex);
    let leftRatio = leftData.reduce((s, d) => s + d.count, 0) / total;

    if (w * 2 > h) {
      let leftWidth = w * leftRatio;
      return [
        ...buildTreemap(leftData, x, y, leftWidth, h),
        ...buildTreemap(rightData, x + leftWidth, y, w - leftWidth, h)
      ];
    } else {
      let topHeight = h * leftRatio;
      return [
        ...buildTreemap(leftData, x, y, w, topHeight),
        ...buildTreemap(rightData, x, y + topHeight, w, h - topHeight)
      ];
    }
  }

  const boxes = buildTreemap(chartData, 0, 0, 100, 100);

  const getBoxTheme = (index, isHL, isDimmed) => {
    if (isHL) return { bg: C.red, text: C.white, border: `2px solid ${C.white}` };
    
    const themes = [
      { bg: C.darkGreen, text: C.white, border: 'none' },
      { bg: C.sage, text: C.white, border: 'none' },
      { bg: C.cardGreen, text: C.darkGreen, border: 'none' },
      { bg: C.midGreen, text: C.white, border: 'none' },
      { bg: C.bgLight, text: C.darkGreen, border: `1px solid ${C.sage}` }
    ];
    
    const theme = themes[index % themes.length];
    if (isDimmed) {
      return { ...theme, bg: C.bgLight50, text: C.sage, border: `1px dashed ${C.sage}` };
    }
    return theme;
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent">
      {boxes.map((box, index) => {
        const isHL = selectedSpecies === box.species_name;
        const isDimmed = selectedSpecies !== 'All' && !isHL;
        const theme = getBoxTheme(index, isHL, isDimmed);
        
        const isTooTiny = box.w < 8 || box.h < 12;
        const hideBadge = box.w < 20 || box.h < 25; 

        return (
          <div 
            key={box.species_name}
            className="absolute p-[3px]" 
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
            }}
          >
            <div
              onClick={() => setSelectedSpecies(isHL ? 'All' : box.species_name)}
              className={`w-full h-full relative rounded-lg transition-all duration-300 overflow-hidden cursor-pointer shadow-sm group p-2 lg:p-3 flex flex-col justify-between ${isHL ? 'scale-[1.02] shadow-xl z-20' : 'hover:scale-[1.02] hover:z-10 hover:shadow-md'}`}
              style={{
                backgroundColor: theme.bg,
                border: theme.border,
              }}
              title={`${box.species_name}: ${box.count} Reports`}
            >
              {!isTooTiny && (
                <>
                  {!hideBadge && (
                    <span 
                      className="font-manjari text-[11px] sm:text-xs lg:text-sm font-bold leading-tight"
                      style={{ 
                        color: theme.text,
                        opacity: 0.9,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {box.species_name}
                    </span>
                  )}

                  <span 
                    className={`font-nerko leading-none transition-transform group-hover:scale-110 ${hideBadge ? 'absolute inset-0 flex items-center justify-center' : 'absolute bottom-2 right-3'}`} 
                    style={{ 
                      color: theme.text,
                      fontSize: hideBadge ? '1.5rem' : `clamp(1.5rem, ${Math.min(box.w, box.h) * 0.8}cqw, 3.5rem)`,
                    }}
                  >
                    {box.count}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [mcts, setMcts] = useState([])
  const [mapPoints, setMapPoints] = useState([])
  const [allReports, setAllReports] = useState([]) 
  const [allSpecies, setAllSpecies] = useState([])
  const [mapFilter, setMapFilter] = useState('all') 
  const [loading, setLoading] = useState(true)
  const [activeLevel, setActiveLevel] = useState('all') 
  const [highlightedPoint, setHighlightedPoint] = useState(null)
  const [mapCenter, setMapCenter] = useState(null)

  const [selectedSpecies, setSelectedSpecies] = useState('All')
  const [selectedMonth, setSelectedMonth] = useState(null) // NEW: Tracks clicked month

  useEffect(() => {
    Promise.all([
      API.get('/dashboard/stats'),
      API.get('/dashboard/mcts'),
      API.get('/map/detections'),
      API.get('/species/'),
      API.get('/admin/reports'), 
    ]).then(([sRes, mRes, mapRes, spRes, rRes]) => {
      setStats(sRes.data); setMcts(mRes.data); setMapPoints(mapRes.data)
      setAllSpecies(spRes.data); setAllReports(rRes.data || [])
    }).finally(() => setLoading(false))
  }, [])

  // Evaluates every species to find its official, most recent MCTS threat level
  const speciesThreatMap = useMemo(() => {
    const threatMap = {};
    const sortedPoints = [...mapPoints].sort((a, b) => new Date(a.detected_at) - new Date(b.detected_at));
    
    sortedPoints.forEach(p => {
      const name = p.species_name;
      if (!name) return;
      
      const mctsData = mcts.find(m => m.report_id === p.report_id);
      const level = mctsData ? (mctsData.threat_level || 'low') : (p.threat_level || 'low');
      const score = mctsData ? (mctsData.total_score || 0) : 0;
      
      threatMap[name] = { level: level.toLowerCase(), score: score };
    });
    
    return threatMap;
  }, [mapPoints, mcts]);

  const baseFilteredMap = useMemo(() => {
    return mapPoints.filter(p => {
      const officialThreat = speciesThreatMap[p.species_name]?.level || 'low';
      const matchThreat = mapFilter === 'all' || officialThreat === mapFilter;
      const matchSpecies = selectedSpecies === 'All' || p.species_name === selectedSpecies;
      return matchThreat && matchSpecies;
    })
  }, [mapPoints, mapFilter, selectedSpecies, speciesThreatMap])

  // FULLY FILTERED MAP: Applies the clicked Month as well. Use this for Map, KPIs, and Top 5!
  const filteredMap = useMemo(() => {
    return baseFilteredMap.filter(p => {
      if (!selectedMonth) return true;
      const d = new Date(p.detected_at);
      const k = `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      return k === selectedMonth;
    });
  }, [baseFilteredMap, selectedMonth])

  useEffect(() => {
    if (selectedSpecies !== 'All') {
      if (filteredMap.length > 0) {
        setMapCenter([filteredMap[0].gps_lat, filteredMap[0].gps_lng]);
        setHighlightedPoint(filteredMap[0].report_id);
      } else {
        setHighlightedPoint(null);
      }
    } else {
      setMapCenter(null); 
      setHighlightedPoint(null);
    }
  }, [selectedSpecies, filteredMap])

  const trendData = useMemo(() => {
    const m = {};
    baseFilteredMap.forEach(p => {
      const d = new Date(p.detected_at);
      const month = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear().toString().slice(-2);
      const k = `${month} '${year}`; 
      // Calculate a unique absolute index to sort chronologically across multiple years
      const absoluteSortIndex = d.getFullYear() * 12 + d.getMonth(); 
      if (!m[k]) m[k] = { label: k, critical: 0, high: 0, moderate: 0, low: 0, sortIdx: absoluteSortIndex };
      
      const officialThreat = speciesThreatMap[p.species_name]?.level || 'low';
      m[k][officialThreat] = (m[k][officialThreat] || 0) + 1;
    });
    return Object.values(m).sort((a, b) => a.sortIdx - b.sortIdx).slice(-8);
  }, [baseFilteredMap, speciesThreatMap])

  const allSpeciesDistData = useMemo(() => {
    if (!allSpecies.length) return [];
    const counts = {};
    const threatFilteredMap = baseFilteredMap.filter(p => {
      if (!selectedMonth) return true;
      const d = new Date(p.detected_at);
      const k = `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
      return k === selectedMonth;
    });

    threatFilteredMap.forEach(p => {
      const name = (p.species_name || '').trim().toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    });

    return allSpecies.map(s => {
      const sName = (s.name || '').trim().toLowerCase();
      return { species_name: s.name, count: counts[sName] || 0 };
    });
  }, [allSpecies, baseFilteredMap, selectedMonth]);

  const mctsCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
    const visibleSpecies = new Set(filteredMap.map(p => p.species_name).filter(Boolean));
    
    visibleSpecies.forEach(name => {
      const threatData = speciesThreatMap[name];
      if (threatData && counts[threatData.level] !== undefined) {
        counts[threatData.level]++;
      }
    });
    
    return counts;
  }, [filteredMap, speciesThreatMap]);

  const top5 = useMemo(() => {
    const visibleSpecies = new Set(filteredMap.map(p => p.species_name).filter(Boolean));
    const list = [];
    
    visibleSpecies.forEach(name => {
      const threatData = speciesThreatMap[name];
      if (threatData && threatData.score > 0) {
        list.push([name, threatData]);
      }
    });
    
    return list.sort((a, b) => b[1].score - a[1].score).slice(0, 5);
  }, [filteredMap, speciesThreatMap]);

  const statusCounts = useMemo(() => {
    if (selectedSpecies === 'All' && !selectedMonth) {
      return {
        validated: stats?.validated_reports || 0,
        pending: stats?.pending_reports || 0,
        rejected: stats?.rejected_reports || 0
      };
    }
    
    let v = 0, p = 0, r = 0;
    if (allReports && allReports.length > 0) {
      allReports.forEach(rep => {
        const repSpecies = (rep.detections?.[0]?.species_name || rep.species_name || '').toLowerCase().trim();
        const targetSpecies = selectedSpecies === 'All' ? null : selectedSpecies.toLowerCase().trim();
        
        let matchS = targetSpecies ? repSpecies === targetSpecies : true;
        let matchM = true;
        
        if (selectedMonth) {
           const d = new Date(rep.submitted_at || rep.created_at);
           const k = `${d.toLocaleString('default', { month: 'short' })} '${d.getFullYear().toString().slice(-2)}`;
           matchM = k === selectedMonth;
        }
        
        if (matchS && matchM) {
          if (rep.status === 'validated') v++;
          else if (rep.status === 'pending') p++;
          else if (rep.status === 'rejected') r++;
        }
      });
    }

    if (v < filteredMap.length) v = filteredMap.length;
    return { validated: v, pending: p, rejected: r };
  }, [selectedSpecies, selectedMonth, allReports, stats, filteredMap]);

  const isFiltered = selectedSpecies !== 'All' || selectedMonth !== null;
  const displayReports = isFiltered ? filteredMap.length : (stats?.total_reports || 0);
  const displaySpecies = isFiltered ? new Set(filteredMap.map(p => p.species_name).filter(Boolean)).size : (allSpecies.length || 0);

  const standardCard = { backgroundColor: C.boxCol, borderRadius: '12px', padding: '16px', height: CARD_HEIGHT, display: 'flex', flexDirection: 'column' }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.white }}>
      <p className="font-manjari text-gray-500">Loading dashboard...</p>
    </div>
  )

  return (
    <div className="p-4 min-h-screen" style={{ backgroundColor: C.white }}>
      <div className="grid grid-cols-2 gap-4">
        
        {/* Left Column */}
        <div className="space-y-4">
          
          <div className="flex gap-4">
            <KPIBox value={displayReports} label={isFiltered ? "MATCHING REPORTS" : "TOTAL REPORTS"} />
            <KPIBox value={displaySpecies} label={isFiltered ? "SPECIES IN VIEW" : "TOTAL SPECIES"} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div style={standardCard}>
              <p className="font-londrina tracking-widest mb-2" style={{ fontSize: '11px', color: C.darkGreen }}>
                {isFiltered ? `FILTERED SYSTEM STATUS` : 'OVERALL SYSTEM STATUS'}
              </p>
              <div className="flex-1 flex items-center justify-center">
                <DonutChart 
                  data={[
                    { label: 'Validated', value: statusCounts.validated, color: C.lightGreen }, 
                    { label: 'Pending', value: statusCounts.pending, color: C.yellow }, 
                    { label: 'Rejected', value: statusCounts.rejected, color: C.red }
                  ].filter(d => d.value > 0)} 
                />
              </div>
            </div>

            <div style={standardCard}>
              <p className="font-londrina tracking-widest mb-4" style={{ fontSize: '11px', color: C.darkGreen }}>TOP 5 ALARMING SPECIES</p>
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {top5.length === 0 ? (
                  <p className="font-manjari text-xs py-4 text-center" style={{ color: C.sage }}>No alarming species in this view</p>
                ) : (
                  top5.map(([name, data], i) => {
                    const isHL = selectedSpecies !== 'All' && name === selectedSpecies;
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors" 
                           style={{ backgroundColor: isHL ? 'rgba(202,0,0,0.1)' : 'rgba(255,255,255,0.55)', border: isHL ? `2px solid ${C.red}` : '2px solid transparent' }}>
                        <span className="font-nerko text-lg w-4 flex-shrink-0" style={{ color: C.muted }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-manjari text-xs font-bold truncate" style={{ color: C.darkGreen }}>{name}</p>
                          <div className="h-1.5 rounded-full mt-1" style={{ backgroundColor: C.bgLight }}>
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(data.score / 10) * 100}%`, backgroundColor: threatColor[data.level] }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-nerko text-sm" style={{ color: C.darkGreen }}>{data.score.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          
          <div style={standardCard}>
            <div className="flex justify-between items-center mb-2">
               <p className="font-londrina tracking-widest" style={{ fontSize: '11px', color: C.darkGreen }}>MONTHLY TRENDS BY THREAT LEVEL</p>
            </div>
            <div className="flex-1">
               <TrendChart 
                 data={trendData} 
                 activeLevel={activeLevel} 
                 setActiveLevel={setActiveLevel} 
                 selectedMonth={selectedMonth}
                 onDotClick={(month, level) => {
                   if (selectedMonth === month && mapFilter === level) {
                     setSelectedMonth(null);
                     setMapFilter('all');
                     setActiveLevel('all');
                   } else {
                     setSelectedMonth(month);
                     setMapFilter(level);
                     setActiveLevel(level);
                   }
                 }}
               />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          
          <div className="grid grid-cols-4 gap-2 relative">
             <MCTSBox value={mctsCounts.critical} label="CRITICAL" level="critical" isActive={mapFilter === 'all' || mapFilter === 'critical'} onClick={() => setMapFilter(mapFilter === 'critical' ? 'all' : 'critical')} />
             <MCTSBox value={mctsCounts.high} label="HIGH" level="high" isActive={mapFilter === 'all' || mapFilter === 'high'} onClick={() => setMapFilter(mapFilter === 'high' ? 'all' : 'high')} />
             <MCTSBox value={mctsCounts.moderate} label="MODERATE" level="moderate" isActive={mapFilter === 'all' || mapFilter === 'moderate'} onClick={() => setMapFilter(mapFilter === 'moderate' ? 'all' : 'moderate')} />
             <MCTSBox value={mctsCounts.low} label="LOW" level="low" isActive={mapFilter === 'all' || mapFilter === 'low'} onClick={() => setMapFilter(mapFilter === 'low' ? 'all' : 'low')} />
          </div>

          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `4px solid ${C.darkGreen}`, height: '340px' }}>
            <MapContainer center={[7.1907, 125.4553]} zoom={9} style={{ height: '100%', width: '100%' }} maxBounds={[[5.5, 123.0], [9.5, 128.0]]} maxBoundsViscosity={0.7}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
              {mapCenter && <MapFly center={mapCenter} />}
              {filteredMap.map(p => { 
                const isHL = selectedSpecies !== 'All' && p.species_name === selectedSpecies; 
                const officialThreat = speciesThreatMap[p.species_name]?.level || 'low';
                
                return (
                  <Marker key={p.report_id} position={[p.gps_lat, p.gps_lng]} icon={createThreatIcon(officialThreat, isHL || p.report_id === highlightedPoint)}>
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold" style={{ color: C.darkGreen }}>{p.species_name}</p>
                        {p.location_name && <p className="text-gray-600">📍 {p.location_name}</p>}
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white uppercase tracking-wider" style={{ backgroundColor: threatColor[officialThreat] }}>
                          {officialThreat} threat
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ) 
              })}
            </MapContainer>
          </div>
          
          <div style={{ ...standardCard, height: CARD_HEIGHT, backgroundColor: 'white', border: `2px solid ${C.bgLight}` }}>
            <div className="flex justify-between items-center mb-3">
               <p className="font-londrina tracking-widest" style={{ fontSize: '11px', color: C.darkGreen }}>SPECIES DISTRIBUTION</p>
               {selectedSpecies !== 'All' && (
                 <button 
                   onClick={() => setSelectedSpecies('All')}
                   className="font-londrina tracking-widest text-[10px] px-3 py-1 rounded-full text-white shadow-sm transition-all hover:scale-105"
                   style={{ backgroundColor: C.red }}
                 >
                   RESET FILTER
                 </button>
               )}
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <SpeciesTreemap 
                data={allSpeciesDistData} 
                selectedSpecies={selectedSpecies} 
                setSelectedSpecies={setSelectedSpecies} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
