import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const LETTER_TEXT = [
  'Mahi,',
  '',
  'This is not about how long something has been going on.',
  'It is about how sweet and romantic this beginning feels, like the very first warm page of something lovely.',
  'I wanted to build you a small universe of stars, music, and gentle words so this new start could feel soft and special.',
  'Every smile, every quiet moment, and every little glance feels like the start of a beautiful story we are writing together.',
  '',
  'This little page is only a mirror of what I feel: hopeful, glowing, and happy to begin with you.',
  '',
  'Always,',
  'the heart that chose you.',
].join('\n');

const FINAL_MESSAGES = [
  'A sweet beginning looks beautiful with you, Mahi.',
  'This new start already feels gentle and romantic.',
  'Forever starts softly when it starts with you.',
];

function createStars(count) {
  return Array.from({ length: count }, (_, index) => {
    const size = Math.random() * 2.4 + 1;
    return {
      id: `star-${index}-${Math.random().toString(36).slice(2, 8)}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${size}px`,
      delay: `${Math.random() * 3.5}s`,
      duration: `${2.8 + Math.random() * 4.5}s`,
      opacity: `${0.15 + Math.random() * 0.6}`,
    };
  });
}

function App() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 820px)').matches;

  const [stage, setStage] = useState('loading');
  const [typedText, setTypedText] = useState('');
  const [musicStatus, setMusicStatus] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [finalMessage, setFinalMessage] = useState(FINAL_MESSAGES[0]);
  const [memoryVisible, setMemoryVisible] = useState([false, false, false, false]);
  const [promiseVisible, setPromiseVisible] = useState([false, false, false]);
  const [hearts, setHearts] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const stars = useMemo(() => createStars(prefersReducedMotion ? 45 : 130), [prefersReducedMotion]);

  const audioRef = useRef(null);
  const letterPaperRef = useRef(null);
  const letterEndRef = useRef(null);
  const fireworksCanvasRef = useRef(null);
  const panelRefs = useRef({});
  const fireworkParticlesRef = useRef([]);
  const fireworksActiveRef = useRef(false);
  const stageRef = useRef(stage);
  const runningRef = useRef(isRunning);
  const sequenceIdRef = useRef(0);
  const ignoreScrollUntilRef = useRef(0);
  const lastUserScrollAtRef = useRef(0);
  const timeoutIdsRef = useRef(new Set());
  const intervalIdsRef = useRef(new Set());
  const animationFrameRef = useRef(null);
  const messageTimerRef = useRef(null);
  const burstTimerRef = useRef(null);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    const loadingTimer = trackTimeout(() => {
      if (stageRef.current === 'loading') {
        changeStage('welcome');
      }
    }, 1500);

    window.addEventListener('resize', resizeFireworksCanvas);

    return () => {
      clearTimer(loadingTimer);
      window.removeEventListener('resize', resizeFireworksCanvas);
      clearScheduledWork();
    };
  }, []);

  useEffect(() => {
    syncStageScroll(stage);
  }, [stage]);

  useEffect(() => {
    if (stage === 'letter' && letterEndRef.current) {
      ignoreScrollFor(120);
      setTimeout(() => {
        letterEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 10);
    }
  }, [typedText, stage]);

  function changeStage(nextStage) {
    stageRef.current = nextStage;
    setStage(nextStage);
  }

  function clearTimer(id) {
    window.clearTimeout(id);
    timeoutIdsRef.current.delete(id);
  }

  function trackTimeout(callback, ms) {
    const id = window.setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      callback();
    }, ms);
    timeoutIdsRef.current.add(id);
    return id;
  }

  function trackInterval(callback, ms) {
    const id = window.setInterval(callback, ms);
    intervalIdsRef.current.add(id);
    return id;
  }

  function clearScheduledWork() {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    intervalIdsRef.current.forEach((id) => window.clearInterval(id));
    timeoutIdsRef.current = new Set();
    intervalIdsRef.current = new Set();

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    fireworksActiveRef.current = false;
    fireworkParticlesRef.current = [];

    if (audioRef.current) {
      audioRef.current.pause();
    }

    messageTimerRef.current = null;
    burstTimerRef.current = null;
  }

  function ignoreScrollFor(ms) {
    ignoreScrollUntilRef.current = performance.now() + ms;
  }

  function handlePanelScroll(panelName) {
    return () => {
      if (performance.now() < ignoreScrollUntilRef.current) {
        return;
      }

      if (stageRef.current === panelName) {
        lastUserScrollAtRef.current = Date.now();
      }
    };
  }

  function syncStageScroll(currentStage) {
    const panel = panelRefs.current[currentStage];
    if (!panel) {
      return;
    }

    ignoreScrollFor(160);
    window.requestAnimationFrame(() => {
      panel.scrollTop = 0;
      if (currentStage === 'letter' && letterPaperRef.current) {
        letterPaperRef.current.scrollTop = 0;
      }
    });
  }

  function resetVisuals() {
    setTypedText('');
    setCounterNote('');
    setFinalMessage(FINAL_MESSAGES[0]);
    setMemoryVisible([false, false, false, false]);
    setPromiseVisible([false, false, false]);
    setHearts([]);
    setMusicStatus('');
    lastUserScrollAtRef.current = 0;

    if (letterPaperRef.current) {
      ignoreScrollFor(160);
      letterPaperRef.current.scrollTop = 0;
    }
  }

  function restartExperience() {
    sequenceIdRef.current += 1;
    clearScheduledWork();
    resetVisuals();
    setIsRunning(false);
    changeStage('loading');

    trackTimeout(() => {
      if (stageRef.current === 'loading') {
        changeStage('welcome');
      }
    }, 1500);
  }

  function startExperience() {
    if (runningRef.current || stageRef.current !== 'welcome') {
      return;
    }

    sequenceIdRef.current += 1;
    const seq = sequenceIdRef.current;

    setIsRunning(true);
    changeStage('stars');
    startMusic();
    startFloatingHearts();
    scheduleStory(seq);
  }

  async function scheduleStory(seq) {
    await delay(prefersReducedMotion ? 1100 : 1700);
    if (!isCurrentSequence(seq)) return;

    changeStage('letter');
    await typeLetter(seq);

    await waitForReadingWindow(
      seq,
      'letter',
      isMobile ? 2500 : 2000,
      prefersReducedMotion ? 900 : 1500,
    );
    if (!isCurrentSequence(seq)) return;

    changeStage('memories');
    revealMemoryCards(seq);

    await waitForReadingWindow(
      seq,
      'memories',
      isMobile ? 11000 : 8500,
      prefersReducedMotion ? 900 : 1800,
    );
    if (!isCurrentSequence(seq)) return;

    changeStage('counter');
    startCounter(seq);

    await waitForReadingWindow(
      seq,
      'counter',
      isMobile ? 9500 : 7500,
      prefersReducedMotion ? 900 : 1800,
    );
    if (!isCurrentSequence(seq)) return;

    changeStage('finale');
    startFireworks(seq);
    rotateFinalMessage(seq);

    await delay(5200);
    if (!isCurrentSequence(seq)) return;
    stopFireworksSoon();
  }

  function isCurrentSequence(seq) {
    return seq === sequenceIdRef.current;
  }

  function delay(ms) {
    return new Promise((resolve) => {
      const id = window.setTimeout(() => {
        timeoutIdsRef.current.delete(id);
        resolve();
      }, ms);
      timeoutIdsRef.current.add(id);
    });
  }

  async function waitForReadingWindow(seq, panelName, minMs, quietMs = prefersReducedMotion ? 1000 : 2200) {
    const startedAt = Date.now();

    while (isCurrentSequence(seq) && stageRef.current === panelName) {
      const elapsed = Date.now() - startedAt;
      const quietFor = Date.now() - lastUserScrollAtRef.current;
      if (elapsed >= minMs && quietFor >= quietMs) {
        return;
      }

      await delay(180);
    }
  }

  async function typeLetter(seq) {
    setTypedText('');

    for (const char of Array.from(LETTER_TEXT)) {
      if (!isCurrentSequence(seq)) {
        return;
      }

      setTypedText((current) => current + char);

      await delay(prefersReducedMotion ? 8 : 58);
    }
  }

  function revealMemoryCards(seq) {
    setMemoryVisible([false, false, false, false]);
    [0, 1, 2, 3].forEach((index) => {
      trackTimeout(() => {
        if (!isCurrentSequence(seq)) {
          return;
        }

        setMemoryVisible((current) => {
          const next = [...current];
          next[index] = true;
          return next;
        });
      }, index * (prefersReducedMotion ? 40 : 240));
    });
  }

  function startCounter(seq) {
    setCounterNote('Every step feels softer when it is a new beginning.');
    setPromiseVisible([false, false, false]);
    [0, 1, 2].forEach((index) => {
      trackTimeout(() => {
        if (!isCurrentSequence(seq)) {
          return;
        }

        setPromiseVisible((current) => {
          const next = [...current];
          next[index] = true;
          return next;
        });
      }, index * (prefersReducedMotion ? 70 : 260));
    });
  }

  function startMusic() {
    if (!audioRef.current) {
      setMusicStatus('No song file is set yet.');
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.92;
    const playPromise = audioRef.current.play();
    setMusicStatus('Playing your song now.');

    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setMusicStatus('Tap the heart again if your browser blocked playback.');
      });
    }
  }

  function startFloatingHearts() {
    const spawn = () => {
      const glyphs = ['♥', '♡', '❤', '❥'];
      const heart = {
        id: `heart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        x: `${Math.random() * 100}vw`,
        size: `${0.9 + Math.random() * 1.4}rem`,
        duration: `${6 + Math.random() * 5}s`,
        dx: `${(Math.random() * 2 - 1) * 18}vw`,
        hue: `${330 + Math.random() * 35}`,
      };

      setHearts((current) => [...current.slice(-24), heart]);
    };

    spawn();

    if (!prefersReducedMotion) {
      trackInterval(spawn, 320);
    }
  }

  function rotateFinalMessage(seq) {
    let index = 0;
    setFinalMessage(FINAL_MESSAGES[index]);

    messageTimerRef.current = trackInterval(() => {
      if (!isCurrentSequence(seq)) {
        return;
      }

      index = (index + 1) % FINAL_MESSAGES.length;
      setFinalMessage(FINAL_MESSAGES[index]);
    }, 1900);
  }

  function resizeFireworksCanvas() {
    const canvas = fireworksCanvasRef.current;
    if (!canvas) {
      return;
    }

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function startFireworks(seq) {
    if (!fireworksCanvasRef.current) {
      return;
    }

    resizeFireworksCanvas();
    fireworkParticlesRef.current = [];
    fireworksActiveRef.current = true;

    let burstCount = 0;

    const burst = () => {
      if (!isCurrentSequence(seq)) {
        return;
      }

      const x = window.innerWidth * (0.18 + Math.random() * 0.64);
      const y = window.innerHeight * (0.16 + Math.random() * 0.28);
      const colors = ['#ff86a9', '#ffd36e', '#9be7ff', '#ff9f91', '#ffffff'];

      for (let i = 0; i < 32; i += 1) {
        const angle = (Math.PI * 2 * i) / 32;
        const speed = 1.8 + Math.random() * 3.7;
        fireworkParticlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed * 1.05,
          vy: Math.sin(angle) * speed * 1.05,
          life: 80 + Math.random() * 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1.6 + Math.random() * 2.8,
        });
      }

      burstCount += 1;
      if (burstCount > 9 && burstTimerRef.current) {
        window.clearInterval(burstTimerRef.current);
        intervalIdsRef.current.delete(burstTimerRef.current);
        burstTimerRef.current = null;
      }
    };

    burst();

    if (!prefersReducedMotion) {
      burstTimerRef.current = trackInterval(burst, 720);
    }

    renderFireworks();
  }

  function stopFireworksSoon() {
    trackTimeout(() => {
      fireworksActiveRef.current = false;
      fireworkParticlesRef.current = [];

      const canvas = fireworksCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (burstTimerRef.current) {
        window.clearInterval(burstTimerRef.current);
        intervalIdsRef.current.delete(burstTimerRef.current);
        burstTimerRef.current = null;
      }

      if (messageTimerRef.current) {
        window.clearInterval(messageTimerRef.current);
        intervalIdsRef.current.delete(messageTimerRef.current);
        messageTimerRef.current = null;
      }
    }, 2800);
  }

  function renderFireworks() {
    const canvas = fireworksCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = 'rgba(5, 4, 10, 0.14)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const nextParticles = [];
    fireworkParticlesRef.current.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.05;
      particle.life -= 1;

      if (particle.life > 0) {
        nextParticles.push(particle);
        const alpha = Math.max(0, particle.life / 100);
        ctx.beginPath();
        ctx.fillStyle = hexToRgba(particle.color, alpha);
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 12;
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    fireworkParticlesRef.current = nextParticles;

    if (fireworksActiveRef.current || nextParticles.length > 0) {
      animationFrameRef.current = window.requestAnimationFrame(renderFireworks);
    } else {
      animationFrameRef.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function hexToRgba(hex, alpha) {
    const normalized = hex.replace('#', '');
    const value =
      normalized.length === 3
        ? normalized
            .split('')
            .map((digit) => digit + digit)
            .join('')
        : normalized;
    const int = Number.parseInt(value, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const appClassName = `app-shell is-${stage} ${stage === 'finale' ? 'is-fireworks' : ''}`;

  return (
    <div className={appClassName}>
      <div className="ambient ambient-a"></div>
      <div className="ambient ambient-b"></div>
      <div id="stars" className="stars" aria-hidden="true">
        {stars.map((star) => (
          <i
            key={star.id}
            className="star"
            style={{
              '--size': star.size,
              '--delay': star.delay,
              '--twinkle-duration': star.duration,
              left: star.left,
              top: star.top,
              opacity: star.opacity,
            }}
          ></i>
        ))}
      </div>

      <canvas ref={fireworksCanvasRef} id="fireworks" className="fireworks" aria-hidden="true"></canvas>

      <div id="floatingHearts" className="floating-hearts" aria-hidden="true">
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="heart"
            style={{
              '--x': heart.x,
              '--size': heart.size,
              '--duration': heart.duration,
              '--dx': heart.dx,
              '--hue': heart.hue,
            }}
            onAnimationEnd={() => {
              setHearts((current) => current.filter((item) => item.id !== heart.id));
            }}
          >
            {heart.glyph}
          </span>
        ))}
      </div>

      <audio
        ref={audioRef}
        id="loveSong"
        src="./assets/music/possible-dreams-mixkit.mp3"
        preload="auto"
        loop
      ></audio>

      <main className="stage">
        <section
          ref={(el) => {
            panelRefs.current.loading = el;
          }}
          className={`panel panel--loading ${stage === 'loading' ? 'is-visible' : ''}`}
          data-stage="loading"
          onScroll={handlePanelScroll('loading')}
        >
          <div className="loading-card">
            <div className="loading-ring" aria-hidden="true"></div>
            <p className="eyebrow">Loading our little universe</p>
            <h1>Preparing something soft, bright, and a little magical.</h1>
            <p className="muted">A heart-shaped sequence is assembling just for you.</p>
          </div>
        </section>

        <section
          ref={(el) => {
            panelRefs.current.welcome = el;
          }}
          className={`panel ${stage === 'welcome' ? 'is-visible' : ''} px-4 py-8 md:p-8 flex items-center justify-center`}
          data-stage="welcome"
          onScroll={handlePanelScroll('welcome')}
        >
          <div className="w-full max-w-3xl mx-auto md:border md:border-white/15 md:rounded-3xl md:bg-white/5 md:backdrop-blur-xl md:shadow-2xl p-4 md:p-8 flex flex-col md:flex-row gap-4 sm:gap-6 relative">
            <div className="absolute -bottom-[45%] -left-[20%] right-[-20%] h-64 bg-pink-500/20 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="relative w-full md:w-[320px] shrink-0 h-[300px] sm:h-[350px] md:h-auto md:min-h-[400px] rounded-2xl md:rounded-[28px] overflow-hidden shadow-xl z-10 md:border md:border-white/10">
              <img className="absolute inset-0 w-full h-full object-cover object-[center_18%] saturate-105 contrast-105" src="./assets/music/mahi.jpeg" alt="Mahi smiling in a soft portrait" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/80"></div>
              <div className="absolute bottom-0 inset-x-0 p-5 z-10">
                <p className="text-[10px] md:text-xs tracking-[0.24em] uppercase text-pink-200/80 mb-1 font-body">For Mahi</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white font-display leading-tight m-0">A sweet beginning</h2>
              </div>
            </div>

            <div className="relative z-10 flex flex-col justify-center text-center md:text-left flex-grow pt-2 md:pt-0 md:py-4">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold font-display leading-tight mb-3 md:mb-4 text-white m-0">
                One click opens a brand-new story.
              </h1>
              <p className="text-[14px] sm:text-[15px] md:text-lg text-pink-50/80 leading-relaxed mb-6 font-body">
                This is not about how long anything has lasted. It is about how beautifully
                something sweet and romantic is just beginning.
              </p>

              <div className="flex justify-center md:justify-start gap-5 text-gold text-xl mb-6 md:mb-8" aria-hidden="true">
                <span>✦</span>
                <span>♥</span>
                <span>✦</span>
              </div>

              <div className="mt-auto flex justify-center md:justify-start w-full">
                <motion.button
                  id="openHeartButton"
                  className="w-full md:w-auto px-6 py-3.5 sm:py-4 bg-gradient-to-br from-pink-400 to-yellow-300 text-slate-900 shadow-[0_14px_40px_rgba(255,119,168,0.32)] font-bold text-base md:text-lg rounded-full flex items-center justify-center gap-2 transition-shadow"
                  type="button"
                  onClick={startExperience}
                  disabled={stage !== 'welcome' || isRunning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Heart size={18} fill="#ff4d4f" color="#ff4d4f" />
                  </motion.div>
                  Click Maau
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={(el) => {
            panelRefs.current.stars = el;
          }}
          className={`panel panel--stars ${stage === 'stars' ? 'is-visible' : ''}`}
          data-stage="stars"
          onScroll={handlePanelScroll('stars')}
        >
          <div className="scene-card">
            <p className="eyebrow">Stars + Music Starts</p>
            <h2>The sky just answered back.</h2>
            <p className="scene-copy">Tiny lights are gathering, and your chosen song is playing now.</p>
            <p className="music-status" id="musicStatus" aria-live="polite">
              {musicStatus}
            </p>
          </div>
        </section>

        <section
          ref={(el) => {
            panelRefs.current.letter = el;
          }}
          className={`panel panel--letter ${stage === 'letter' ? 'is-visible' : ''}`}
          data-stage="letter"
          onScroll={handlePanelScroll('letter')}
        >
          <div className="letter-card">
            <p className="eyebrow">Typing Message</p>
            <h2>Every word arrives slowly, like a heartbeat.</h2>
            <div ref={letterPaperRef} className="letter-paper" onScroll={handlePanelScroll('letter')}>
              <p id="typedLetter" className="typed-letter" aria-live="polite">
                {typedText}
              </p>
              <span className="typing-cursor" aria-hidden="true"></span>
              <div ref={letterEndRef} style={{ height: '1px' }}></div>
            </div>
          </div>
        </section>

        <section
          ref={(el) => {
            panelRefs.current.memories = el;
          }}
          className={`panel panel--memories ${stage === 'memories' ? 'is-visible' : ''}`}
          data-stage="memories"
          onScroll={handlePanelScroll('memories')}
        >
          <div className="scene-card">
            <p className="eyebrow">Little Moments</p>
            <h2>Soft moments, still unfolding.</h2>
            <p className="scene-copy">This part stays light, because the best stories are still growing.</p>
            <div className="memory-grid">
              <article className={`memory-card memory-card--one ${memoryVisible[0] ? 'is-visible' : ''}`}>
                <span className="memory-glow"></span>
                <div className="memory-label">
                  <h3>The first hello</h3>
                  <p>A tiny moment that opened the door to something sweet.</p>
                </div>
              </article>
              <article className={`memory-card memory-card--two ${memoryVisible[1] ? 'is-visible' : ''}`}>
                <span className="memory-glow"></span>
                <div className="memory-label">
                  <h3>Fresh smiles</h3>
                  <p>New beginnings always feel softer when they are shared.</p>
                </div>
              </article>
              <article className={`memory-card memory-card--three ${memoryVisible[2] ? 'is-visible' : ''}`}>
                <span className="memory-glow"></span>
                <div className="memory-label">
                  <h3>Sweet pauses</h3>
                  <p>Little pauses that make the heart slow down and smile.</p>
                </div>
              </article>
              <article className={`memory-card memory-card--four ${memoryVisible[3] ? 'is-visible' : ''}`}>
                <span className="memory-glow"></span>
                <div className="memory-label">
                  <h3>What is ahead</h3>
                  <p>A gentle path where something lovely can bloom.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          ref={(el) => {
            panelRefs.current.counter = el;
          }}
          className={`panel panel--counter ${stage === 'counter' ? 'is-visible' : ''}`}
          data-stage="counter"
          onScroll={handlePanelScroll('counter')}
        >
          <div className="counter-card">
            <p className="eyebrow">New Chapter</p>
            <h2>A sweet beginning made for Mahi.</h2>
            <p className="scene-copy">
              This is not a countdown. It is a gentle reminder that something romantic and
              beautiful is only just starting.
            </p>
            <div className="promise-grid">
              <article className={`promise-card ${promiseVisible[0] ? 'is-visible' : ''}`}>
                <span className="promise-index">01</span>
                <h3>Take it slow</h3>
                <p>Let every moment arrive softly and feel easy to hold.</p>
              </article>
              <article className={`promise-card ${promiseVisible[1] ? 'is-visible' : ''}`}>
                <span className="promise-index">02</span>
                <h3>Stay gentle</h3>
                <p>Keep the mood sweet, warm, and full of little smiles.</p>
              </article>
              <article className={`promise-card ${promiseVisible[2] ? 'is-visible' : ''}`}>
                <span className="promise-index">03</span>
                <h3>Grow together</h3>
                <p>Let this fresh story bloom into something lovely.</p>
              </article>
            </div>
            <p className="counter-footnote" id="counterNote">
              {counterNote}
            </p>
          </div>
        </section>

        <section
          ref={(el) => {
            panelRefs.current.finale = el;
          }}
          className={`panel panel--finale ${stage === 'finale' ? 'is-visible' : ''}`}
          data-stage="finale"
          onScroll={handlePanelScroll('finale')}
        >
          <div className="final-card">
            <p className="eyebrow">Final Surprise</p>
            <h2 id="finalMessage">{finalMessage}</h2>
            <p className="scene-copy">
              This is not a long story. It is a tender new one, and it feels like the prettiest start.
            </p>
            <button id="replayButton" className="secondary-button" type="button" onClick={restartExperience}>
              Replay the magic
            </button>
          </div>
        </section>
      </main>


    </div>
  );
}

export default App;
