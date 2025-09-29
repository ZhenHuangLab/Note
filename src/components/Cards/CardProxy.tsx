import React from 'react';
import Card, { CardProps } from './Card';
import { isAlternateArtId } from './alternate-arts';

type StringLike = string | number;

export interface CardProxyProps {
  id?: string;
  name?: string;
  number?: StringLike;
  set?: StringLike;
  types?: string | string[];
  subtypes?: string | string[];
  supertype?: string;
  rarity?: string;
  isReverse?: boolean;
  pageURL?: string;
  img?: string;
  imgLarge?: string;
  back?: string;
  foil?: string | false;
  mask?: string | false;
  showcase?: boolean;
}

type ForwardCardProps = CardProps & {
  back?: string;
  foil?: string;
  mask?: string;
  set?: string;
  types?: string;
  pageURL?: string;
};

const rawCdnBase = typeof process !== 'undefined' ? process.env?.['VITE_CDN'] : undefined;
const cdnBase = typeof rawCdnBase === 'string' ? rawCdnBase.replace(/\/+$/, '') : '';

const isDefined = <T,>(value: T | null | undefined): value is T => value !== undefined && value !== null;

const normalizeString = (value?: StringLike): string | undefined => {
  if (!isDefined(value)) {
    return undefined;
  }
  return String(value);
};

const normalizeList = (value?: string | string[]): string | undefined => {
  if (!isDefined(value)) {
    return undefined;
  }
  return Array.isArray(value) ? value.join(' ') : value;
};

const buildCardImage = (img?: string, setId?: string, numberId?: string): string => {
  if (isDefined(img)) {
    return img;
  }
  if (isDefined(setId) && isDefined(numberId)) {
    return `https://images.pokemontcg.io/${setId.toLowerCase()}/${numberId}_hires.png`;
  }
  return '';
};

const buildFoilMask = (
  props: {
    foilOrMask?: string | false;
    rarity: string;
    subtypes: string;
    supertype?: string;
    setId?: string;
    numberId?: string;
    isShiny: boolean;
    isGallery: boolean;
    isAlternate: boolean;
  },
  type: 'foils' | 'masks'
): { url: string; rarity: string } => {
  const {
    foilOrMask,
    rarity,
    subtypes,
    supertype,
    setId,
    numberId,
    isShiny,
    isGallery,
    isAlternate,
  } = props;

  let computedRarity = rarity;

  if (typeof foilOrMask !== 'undefined' && foilOrMask !== null) {
    if (foilOrMask === false) {
      return { url: '', rarity: computedRarity };
    }
    return { url: foilOrMask, rarity: computedRarity };
  }

  if (!isDefined(computedRarity) || !isDefined(subtypes) || !isDefined(supertype) || !isDefined(setId) || !isDefined(numberId)) {
    return { url: '', rarity: computedRarity };
  }

  let etch = 'holo';
  let style = 'reverse';
  const ext = 'webp';

  const fRarity = computedRarity.toLowerCase();
  const fNumber = numberId.toLowerCase().replace('swsh', '').padStart(3, '0');
  const fSet = setId.toLowerCase().replace('tg', '').replace('sv', '');

  if (fRarity === 'rare holo') {
    style = 'swholo';
  }

  if (fRarity === 'rare holo cosmos') {
    style = 'cosmos';
  }

  if (fRarity === 'radiant rare') {
    etch = 'etched';
    style = 'radiantholo';
  }

  if (fRarity === 'rare holo v') {
    etch = 'holo';
    style = 'sunpillar';
  }

  if (fRarity === 'rare holo vmax' || fRarity === 'rare ultra' || fRarity === 'rare holo vstar') {
    etch = 'etched';
    style = 'sunpillar';
  }

  if (fRarity === 'amazing rare' || fRarity === 'rare rainbow' || fRarity === 'rare secret') {
    etch = 'etched';
    style = 'swsecret';
  }

  if (isShiny) {
    etch = 'etched';
    style = 'sunpillar';

    if (fRarity === 'rare shiny v' || (fRarity === 'rare holo v' && fNumber.startsWith('sv'))) {
      computedRarity = 'Rare Shiny V';
    }

    if (fRarity === 'rare shiny vmax' || (fRarity === 'rare holo vmax' && fNumber.startsWith('sv'))) {
      style = 'swsecret';
      computedRarity = 'Rare Shiny VMAX';
    }
  }

  if (isGallery) {
    etch = 'holo';
    style = 'rainbow';

    if (fRarity.includes('rare holo v') || fRarity.includes('rare ultra')) {
      etch = 'etched';
      style = 'sunpillar';
    }

    if (fRarity.includes('rare secret')) {
      etch = 'etched';
      style = 'swsecret';
    }
  }

  if (isAlternate) {
    etch = 'etched';

    if (subtypes.includes('VMAX')) {
      style = 'swsecret';
      computedRarity = 'Rare Rainbow Alt';
    } else {
      style = 'sunpillar';
    }
  }

  if (!cdnBase) {
    return { url: '', rarity: computedRarity };
  }

  const url = `${cdnBase}/foils/${fSet}/${type}/upscaled/${fNumber}_foil_${etch}_${style}_2x.${ext}`;
  return { url, rarity: computedRarity };
};

const CardProxy: React.FC<CardProxyProps> = (props) => {
  const {
    id,
    name,
    number,
    set,
    types,
    subtypes,
    supertype,
    rarity,
    isReverse = false,
    pageURL,
    img,
    imgLarge,
    back,
    foil,
    mask,
    showcase = false,
  } = props;

  const numberId = normalizeString(number);
  const normalizedId = normalizeString(id);
  const setId = normalizeString(set);
  const subtypesValue = normalizeList(subtypes) ?? '';
  const typesValue = normalizeList(types);
  const supertypeValue = supertype ?? '';

  let computedRarity = rarity ?? '';
  if (isReverse) {
    computedRarity = computedRarity ? `${computedRarity} Reverse Holo` : 'Reverse Holo';
  }

  const isShiny = Boolean(numberId && numberId.toLowerCase().startsWith('sv'));
  const isGallery = Boolean(numberId && /^[tg]g/i.test(numberId));
  const isAlternate = Boolean(normalizedId && isAlternateArtId(normalizedId) && !isShiny && !isGallery);

  const baseImg = buildCardImage(img, setId, numberId);

  const foilResult = buildFoilMask(
    {
      foilOrMask: foil,
      rarity: computedRarity,
      subtypes: subtypesValue,
      supertype: supertypeValue,
      setId,
      numberId,
      isShiny,
      isGallery,
      isAlternate,
    },
    'foils'
  );
  computedRarity = foilResult.rarity;

  const maskResult = buildFoilMask(
    {
      foilOrMask: mask,
      rarity: computedRarity,
      subtypes: subtypesValue,
      supertype: supertypeValue,
      setId,
      numberId,
      isShiny,
      isGallery,
      isAlternate,
    },
    'masks'
  );
  computedRarity = maskResult.rarity;

  const forward: ForwardCardProps = {
    img: baseImg,
    imgLarge,
    name,
    number: numberId,
    set: setId,
    types: typesValue,
    subtypes: subtypesValue,
    supertype: supertypeValue,
    rarity: computedRarity || undefined,
    showcase,
    back,
    foil: foilResult.url || undefined,
    mask: maskResult.url || undefined,
    pageURL,
  };

  return <Card {...forward} />;
};

export default CardProxy;
