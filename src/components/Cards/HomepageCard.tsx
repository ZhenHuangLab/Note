import React, { useEffect, useState } from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';

import CardProxy from './CardProxy';

export type CardEntry = {
  pageURL: string;
  image: string;
  imageLight?: string;
};

export const CARD_ENTRIES: readonly CardEntry[] = [
  { pageURL: '#', image: '/assets/cards/back.png', imageLight: '/assets/cards/back.light.png' },
  { pageURL: '/cs/pl/riscv/', image: '/assets/cards/riscv.png', imageLight: '/assets/cards/riscv.light.png' },
  { pageURL: '/cs/pl/rust/basic/', image: '/assets/cards/rust.png', imageLight: '/assets/cards/rust.light.png' },
  { pageURL: '/cs/pl/haskell/', image: '/assets/cards/haskell.png', imageLight: '/assets/cards/haskell.light.png' },
  { pageURL: '/cs/system/', image: '/assets/cards/system.png', imageLight: '/assets/cards/system.light.png' },
  { pageURL: '/cs/pl/asm/', image: '/assets/cards/asm.png', imageLight: '/assets/cards/asm.light.png' },
  { pageURL: '/cs/algorithm/ds/', image: '/assets/cards/ds.png', imageLight: '/assets/cards/ds.light.png' },
  { pageURL: '/cs/regex/', image: '/assets/cards/regex.png', imageLight: '/assets/cards/regex.light.png' },
  { pageURL: '/cs/unicode/', image: '/assets/cards/unicode.png', imageLight: '/assets/cards/unicode.light.png' },
  { pageURL: '/cs/tools/', image: '/assets/cards/tools.png', imageLight: '/assets/cards/tools.light.png' },
  { pageURL: '/sec/vulns/log4j/', image: '/assets/cards/log4j.png', imageLight: '/assets/cards/log4j.light.png' },
  { pageURL: '/web/svg/', image: '/assets/cards/svg.png', imageLight: '/assets/cards/svg.light.png' },
  { pageURL: '/ctf/qrcode/', image: '/assets/cards/qrcode.png', imageLight: '/assets/cards/qrcode.light.png' },
  { pageURL: '/ctf/blockchain/eth/', image: '/assets/cards/eth.png', imageLight: '/assets/cards/eth.light.png' },
  { pageURL: '/ctf/escapes/pysandbox/', image: '/assets/cards/pyjail.png', imageLight: '/assets/cards/pyjail.light.png' },
  { pageURL: '/writeups/', image: '/assets/cards/writeups.png', imageLight: '/assets/cards/writeups.light.png' },
  { pageURL: '#', image: '/assets/cards/donate.png', imageLight: '/assets/cards/donate.light.png' },
];

const PIKACHU_CARD = {
  id: 'swsh12pt5-160',
  name: 'Pikachu',
  types: 'Lightning',
  supertype: 'Pokémon',
  subtypes: 'Basic',
  rarity: 'Rare Secret',
};

const pickRandomEntry = (entries: readonly CardEntry[]): CardEntry => {
  if (entries.length === 0) {
    return { pageURL: '#', image: '/assets/cards/back.png', imageLight: '/assets/cards/back.light.png' };
  }
  const index = Math.floor(Math.random() * entries.length);
  return entries[index];
};

const HomepageCard: React.FC = () => {
  const { colorMode } = useColorMode();
  const [selected, setSelected] = useState<CardEntry>(() => CARD_ENTRIES[0]);

  useEffect(() => {
    setSelected(pickRandomEntry(CARD_ENTRIES));
  }, []);

  const imagePath = colorMode === 'light' && selected.imageLight ? selected.imageLight : selected.image;
  const resolvedImage = useBaseUrl(imagePath);
  const resolvedLink = useBaseUrl(selected.pageURL);

  const cardImage = resolvedImage;
  const normalizedLink = selected.pageURL.trim();
  const cardLink = normalizedLink.startsWith('http://') || normalizedLink.startsWith('https://') || normalizedLink.startsWith('#')
    ? normalizedLink
    : resolvedLink;

  return (
    <div className="homepage-card__wrapper">
      <CardProxy
        id={PIKACHU_CARD.id}
        name={PIKACHU_CARD.name}
        types={PIKACHU_CARD.types}
        supertype={PIKACHU_CARD.supertype}
        subtypes={PIKACHU_CARD.subtypes}
        rarity={PIKACHU_CARD.rarity}
        showcase
        pageURL={cardLink}
        img={cardImage}
        imgLarge={cardImage}
      />
    </div>
  );
};

export default HomepageCard;
