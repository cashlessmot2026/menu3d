import React, { useEffect, useRef, useState } from 'react';
import PlateViewer from './components/PlateViewer.jsx';
import { fetchDishes } from './lib/supabase.js';

// Platos de respaldo: se muestran si Supabase no responde o la tabla está vacía.
const fallbackDishes = [
  {
    id: 'burger',
    name: 'Ámbar Burger',
    category: 'De la casa',
    description: 'Carne a la parrilla, queso fundido, tocineta y pan dorado. Una hamburguesa para disfrutar sin afán.',
    image: `${import.meta.env.BASE_URL}images/ambar-burger.webp`,
    price: 'Consulta en el restaurante',
    accent: '#e8a33e',
  },
  {
    id: 'panceta',
    name: 'Panceta crocante',
    category: 'Entradas',
    description: 'Panceta dorada y crujiente sobre una base cremosa de aguacate, terminada con cebolla encurtida.',
    image: `${import.meta.env.BASE_URL}images/panceta-crocante.webp`,
    price: 'Consulta en el restaurante',
    accent: '#c79a4c',
  },
  {
    id: 'steak',
    name: 'Steak al romero',
    category: 'Cortes a la parrilla',
    description: 'Corte de res sellado a la parrilla, acompañado de romero fresco y salsa de hierbas.',
    image: `${import.meta.env.BASE_URL}images/steak-romero.webp`,
    price: 'Consulta en el restaurante',
    accent: '#a77c44',
  },
];

export default function App() {
  const [dishes, setDishes] = useState(fallbackDishes);
  const [active, setActive] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const viewerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchDishes()
      .then((remote) => {
        if (!cancelled && remote) {
          setDishes(remote);
          setActive(0);
        }
      })
      .catch((error) => console.warn('[Supabase] Error de conexión:', error));
    return () => { cancelled = true; };
  }, []);

  const dish = dishes[Math.min(active, dishes.length - 1)];

  const changeDish = (direction) => {
    setActive((current) => (current + direction + dishes.length) % dishes.length);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Ámbar Steak House, inicio">
          <span className="brand-script">Ámbar</span>
          <span className="brand-sub">STEAK <i>✦</i> HOUSE</span>
        </a>
        <div className="topbar-right">
          <span className="open-indicator"><span /> EXPERIENCIA INTERACTIVA</span>
          <a className="top-link" href="#menu">Explorar menú <span>↗</span></a>
        </div>
      </header>

      <section className="intro" id="inicio">
        <p className="eyebrow"><span /> SABOR QUE SE SIENTE</p>
        <h1>Tu próximo antojo,<br /><em>en otra dimensión.</em></h1>
        <p className="intro-copy">Acércate, gira y descubre cada detalle de nuestra cocina.</p>
      </section>

      <section className="experience" aria-label="Visualizador 3D de platos">
        <div className="viewer-heading">
          <div>
            <span className="dish-category">{dish.category}</span>
            <h2>{dish.name}</h2>
          </div>
          <div className="view-status"><span className="live-dot" /> VISTA 360° INTERACTIVA</div>
        </div>

        <div className="viewer-stage" style={{ '--dish-accent': dish.accent }}>
          <div className="stage-glow" />
          <div className="stage-grid" />
          <PlateViewer
            ref={viewerRef}
            key={dish.id}
            image={dish.image}
            autoRotate={autoRotate}
          />
          <button className="stage-arrow stage-arrow-left" onClick={() => changeDish(-1)} aria-label="Plato anterior">‹</button>
          <button className="stage-arrow stage-arrow-right" onClick={() => changeDish(1)} aria-label="Plato siguiente">›</button>
          <div className="drag-hint"><span className="drag-icon">↔</span> ARRASTRA PARA GIRAR</div>
          <div className="stage-index">{String(active + 1).padStart(2, '0')}<span> / {String(dishes.length).padStart(2, '0')}</span></div>
        </div>

        <div className="viewer-toolbar">
          <div className="toolbar-group">
            <button className="tool-button" onClick={() => viewerRef.current?.zoom(-0.7)} aria-label="Alejar">−</button>
            <span className="tool-label">ZOOM</span>
            <button className="tool-button" onClick={() => viewerRef.current?.zoom(0.7)} aria-label="Acercar">+</button>
          </div>
          <div className="toolbar-divider" />
          <button className={`rotate-toggle ${autoRotate ? 'is-active' : ''}`} onClick={() => setAutoRotate((value) => !value)}>
            <span className="rotate-symbol">⟳</span> {autoRotate ? 'PAUSAR GIRO' : 'GIRO AUTOMÁTICO'}
          </button>
          <div className="toolbar-divider" />
          <button className="reset-button" onClick={() => viewerRef.current?.reset()}><span>↺</span> REINICIAR VISTA</button>
        </div>
        <p className="mobile-tip">Desliza sobre el plato para girarlo · Pellizca para acercar</p>
      </section>

      <section className="dish-info">
        <div className="dish-copy">
          <span className="small-overline">UNA EXPERIENCIA PARA LOS SENTIDOS</span>
          <h3>{dish.name}<span>.</span></h3>
          <p>{dish.description}</p>
          <span className="price-note">{dish.price}</span>
        </div>
        <div className="dish-selector" id="menu">
          <span className="selector-label">DESCUBRE OTROS PLATOS</span>
          <div className="dish-options">
            {dishes.map((item, index) => (
              <button key={item.id} className={`dish-option ${index === active ? 'selected' : ''}`} onClick={() => setActive(index)} aria-pressed={index === active}>
                <span className="option-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="option-text"><strong>{item.name}</strong><small>{item.category}</small></span>
                <span className="option-arrow">↗</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>ÁMBAR STEAK HOUSE</span>
        <span className="footer-center">HECHO PARA DISFRUTAR</span>
        <span>MENÚ DIGITAL <i>✦</i></span>
      </footer>
    </main>
  );
}
