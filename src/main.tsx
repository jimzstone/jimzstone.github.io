import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import effects from '../effects.json';
import './utilities.css';

const filters = ['All projects', 'Android', 'Windows', 'Web'] as const;
type Filter = (typeof filters)[number];

function ProjectFilters() {
  const [selected, setSelected] = useState<Filter>('All projects');
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const activeAnimations: Animation[] = [];
    document.querySelectorAll<HTMLElement>('.project').forEach((project) => {
      const show =
        selected === 'All projects' || project.dataset.platform === selected;
      project.hidden = !show;
      if (show && !reduceMotion) {
        activeAnimations.push(
          project.animate(
            [
              { opacity: 0, translate: '0 8px' },
              { opacity: 1, translate: '0 0' },
            ],
            {
              duration: effects.filter.duration * 1000,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            },
          ),
        );
      }
    });
    window.dispatchEvent(new Event('resize'));
    return () => activeAnimations.forEach((animation) => animation.cancel());
  }, [selected, reduceMotion]);
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="project-filters flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Filter projects by platform"
      >
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={selected === filter}
            onClick={() => setSelected(filter)}
            className="filter-button relative"
          >
            {selected === filter ? (
              <motion.span
                className="filter-selection"
                layoutId="selected-platform"
                transition={{
                  duration: reduceMotion ? 0 : effects.filter.duration,
                }}
              />
            ) : null}
            <span className="relative">{filter}</span>
          </button>
        ))}
        <span className="filter-count" role="status">
          {selected === 'All projects'
            ? '4 projects'
            : selected === 'Web'
              ? '2 projects'
              : '1 project'}
        </span>
      </div>
    </MotionConfig>
  );
}

const mount = document.getElementById('project-filters');
if (mount) createRoot(mount).render(<ProjectFilters />);

