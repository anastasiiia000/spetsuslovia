(() => {
  const deck = document.querySelector('.deck');
  const slides = [...document.querySelectorAll('.slide')];
  const progress = document.querySelector('.progress span');
  if (!deck || !slides.length || !progress) return;

  const mobileQuery = window.matchMedia(
    '(max-width: 760px), (max-height: 560px) and (orientation: landscape) and (max-width: 900px)'
  );
  const isMobile = () => mobileQuery.matches;
  let current = 0;
  let observer = null;

  const go = (index) => {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateProgress = () => {
    let scrollTop;
    let scrollHeight;
    let viewportHeight;

    if (isMobile()) {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      viewportHeight = window.innerHeight;
    } else {
      scrollTop = deck.scrollTop;
      scrollHeight = deck.scrollHeight;
      viewportHeight = deck.clientHeight;
    }

    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    progress.style.width = `${maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0}%`;
  };

  const updateCurrentMobile = () => {
    const viewportTop = 0;
    let bestIndex = 0;
    let bestDistance = Infinity;

    slides.forEach((slide, index) => {
      const distance = Math.abs(slide.getBoundingClientRect().top - viewportTop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    current = bestIndex;
  };

  const checkOverflow = (frame) => {
    const selectors = '.slide-head,.body-area,.grid,.card,.ribbon,.schedule-foot,.tech-note,.system-bar';
    return [...frame.querySelectorAll(selectors)].some((el) => {
      if (!el.clientWidth || !el.clientHeight) return false;
      return el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3;
    });
  };

  // The typographic fit routine is intended for the fixed 16:9 desktop canvas.
  // Mobile uses natural-height sections and must never shrink text to fit a viewport.
  const fitSlides = () => {
    if (isMobile()) {
      slides.forEach((slide) => {
        const frame = slide.querySelector('.frame');
        if (frame) frame.classList.remove('fit-tight', 'fit-extra');
      });
      return;
    }

    slides.forEach((slide) => {
      const frame = slide.querySelector('.frame');
      if (!frame) return;
      frame.classList.remove('fit-tight', 'fit-extra');
      if (checkOverflow(frame)) frame.classList.add('fit-tight');
      if (checkOverflow(frame)) frame.classList.add('fit-extra');
    });
  };

  const setupObserver = () => {
    if (observer) observer.disconnect();
    observer = null;

    if (isMobile()) {
      updateCurrentMobile();
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) current = slides.indexOf(entry.target);
      });
    }, { root: deck, threshold: .58 });

    slides.forEach((slide) => observer.observe(slide));
  };

  const onScroll = () => {
    updateProgress();
    if (isMobile()) updateCurrentMobile();
  };

  document.addEventListener('keydown', (event) => {
    // Keep ordinary browser and assistive-technology shortcuts untouched.
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (['ArrowDown', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      go(current + 1);
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      go(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      go(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      go(slides.length - 1);
    }
  });

  deck.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    fitSlides();
    setupObserver();
    onScroll();
  }, { passive: true });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', () => {
      fitSlides();
      setupObserver();
      onScroll();
    });
  } else if (mobileQuery.addListener) {
    mobileQuery.addListener(() => {
      fitSlides();
      setupObserver();
      onScroll();
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitSlides);
  }

  fitSlides();
  setupObserver();
  requestAnimationFrame(() => {
    fitSlides();
    onScroll();
  });
})();
