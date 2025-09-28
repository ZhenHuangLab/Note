import React from 'react';
import Layout from '@theme/Layout';
import Card from '../components/Cards/Card';

// Import the CSS files
import '/css/cards/base.css';
import '/css/cards/cards.css';

export default function TestCardsPage() {
  return (
    <Layout title="Test Cards" description="Testing the Card component">
      <div style={{
        padding: '2rem',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <Card
          img="/assets/cards/riscv.png"
          imgLarge="/assets/cards/riscv.png"
          name="RISC-V"
          number="001"
          rarity="rare"
          subtypes="water"
        />
        <Card
          img="/assets/cards/riscv.light.png"
          imgLarge="/assets/cards/riscv.light.png"
          name="RISC-V Light"
          number="002"
          rarity="common"
          subtypes="fire"
        />
      </div>
    </Layout>
  );
}