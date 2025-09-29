import React, { useEffect, useMemo, useState } from 'react';

type Props = {
  cardRef: React.RefObject<HTMLElement>;
};

const DEV = process.env.NODE_ENV !== 'production';

const line = (label: string, value: string) => `${label}: ${value}`;

export default function CardHud({ cardRef }: Props) {
  const [vars, setVars] = useState(() => ({
    rotX: '0deg',
    rotY: '0deg',
    rotDeltaX: '0deg',
    rotDeltaY: '0deg',
    glareX: '50%',
    glareY: '50%',
    opacity: '0',
    bgX: '50%',
    bgY: '50%',
    ptrX: '50%',
    ptrY: '50%',
    scale: '1',
    translateX: '0px',
    translateY: '0px',
  }));

  useEffect(() => {
    if (!DEV) return;
    let timer: number | undefined;
    const el = cardRef.current;
    if (!el) return;

    const read = () => {
      const cs = getComputedStyle(el);
      setVars({
        rotX: cs.getPropertyValue('--rotate-x').trim() || '0deg',
        rotY: cs.getPropertyValue('--rotate-y').trim() || '0deg',
        rotDeltaX: cs.getPropertyValue('--rotate-delta-x').trim() || '0deg',
        rotDeltaY: cs.getPropertyValue('--rotate-delta-y').trim() || '0deg',
        glareX: cs.getPropertyValue('--glare-x').trim() || '50%',
        glareY: cs.getPropertyValue('--glare-y').trim() || '50%',
        opacity: cs.getPropertyValue('--card-opacity').trim() || '0',
        bgX: cs.getPropertyValue('--background-x').trim() || '50%',
        bgY: cs.getPropertyValue('--background-y').trim() || '50%',
        ptrX: cs.getPropertyValue('--pointer-x').trim() || '50%',
        ptrY: cs.getPropertyValue('--pointer-y').trim() || '50%',
        scale: cs.getPropertyValue('--card-scale').trim() || '1',
        translateX: cs.getPropertyValue('--translate-x').trim() || '0px',
        translateY: cs.getPropertyValue('--translate-y').trim() || '0px',
      });
      timer = window.setTimeout(read, 100);
    };
    timer = window.setTimeout(read, 100);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [cardRef]);

  const hud = useMemo(
    () => [
      line('rot', `${vars.rotX}, ${vars.rotY}`),
      line('rotΔ', `${vars.rotDeltaX}, ${vars.rotDeltaY}`),
      line('glare', `${vars.glareX}, ${vars.glareY}`),
      line('opacity', vars.opacity),
      line('bg', `${vars.bgX}, ${vars.bgY}`),
      line('ptr', `${vars.ptrX}, ${vars.ptrY}`),
      line('scale', vars.scale),
      line('translate', `${vars.translateX}, ${vars.translateY}`),
    ],
    [vars]
  );

  if (!DEV) return null;

  return (
    <div
      className="card__devhud"
      style={{
        gridArea: '1 / 1',
        alignSelf: 'start',
        justifySelf: 'start',
        margin: '6px',
        padding: '6px 8px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 10,
        lineHeight: 1.25,
        color: '#fff',
        background: 'rgba(0,0,0,.45)',
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 6,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 99,
        whiteSpace: 'pre',
      }}
    >
      {hud.join('\n')}
    </div>
  );
}
