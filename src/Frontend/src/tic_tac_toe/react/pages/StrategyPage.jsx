/**
 * @file StrategyPage.jsx
 * @brief Strategy guide page for the Tic-Tac-Toe game.
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '../../../components/Header';
import styles from '../../../Styles';
import colors from '../../../Colors';

// Local UI components
import Pill from '../components/pill.jsx';
import Card from '../components/card.jsx';
import UnderHeader from '../components/underHeader.jsx';

export default function StrategyPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('forks'); // 'overview' | 'forks' | 'algo'
    const headerRef = useRef(null);

    const lead =
            'A concise, practical guide to optimal tic-tac-toe: openings, forks and blocks, common pitfalls, and a simple decision algorithm for calculating the best move.';

    // Static strategy text content for each tab
    const contentMap = {
        overview: {
            leftTitle: 'Goal: force a win or a draw',
            leftIntro:
                    'Tic-tac-toe is a solved game. With perfect play, the result is always a draw. Your aim is to capitalize on opponent mistakes while never leaving a winning opportunity open.',
            leftListTitle: 'The three principles to remember:',
            leftList: [
                'Control the center. It gives access to 4 lines at once.',
                'Create two threats at once (a fork). Opponent can block only one.',
                'Block open twos immediately. Never allow a free third mark.',
            ],
            rightTitle: 'Priority of moves',
            rightList: [
                'Win: if you have two in a row, complete it.',
                'Block: if the opponent has two in a row, block it.',
                'Fork: create a position with two simultaneous winning threats.',
                'Block fork: force the opponent to defend or take the center/corner accordingly.',
                'Center → Opposite corner → Empty corner → Empty side.',
            ],
        },
        forks: {
            leftTitle: 'Creating forks (two threats at once)',
            leftList: [
                'Corner + opposite corner with center occupied creates twin lines next move.',
                'Center + corner often yields a fork after placing on an empty corner.',
                'Use moves that participate in multiple lines; avoid sides unless they support a fork pattern.',
            ],
            rightTitle: 'Blocking forks',
            rightList: [
                'Win: if you have two in a row, complete it.',
                'Block: if the opponent has two in a row, block it.',
                'Fork: create a position with two simultaneous winning threats.',
                'Block fork: force the opponent to defend or take the center/corner accordingly.',
                'Center → Opposite corner → Empty corner → Empty side.',
            ],
        },
        algo: {
            leftTitle: 'Calculating the best move',
            leftList: [
                'Win: complete three/five in a row.',
                'Block: prevent opponent’s immediate win.',
                'Fork: create two threats at once.',
                'Block fork: play center, pressure corner, or force a single-reply.',
                'Play center when available.',
                'Play opposite corner if opponent has corner.',
                'Play any empty corner.',
                'Play an empty side as last resort.',
            ],
            rightTitle: 'Common pitfalls',
            rightList: [
                'Ignoring open twos (leaves forced loss next move).',
                'Side overuse in openings (weak tempo).',
                'Blocking one threat while allowing a fork.',
                'Chasing single lines instead of creating double threats.',
            ],
        },
    };

    const content = contentMap[tab];

    // Basic layout styles
    const page = { ...styles.container, alignItems: 'stretch', padding: 0 };

    const wrap = {
        width: 'min(1200px, 92vw)',
        margin: '0 auto',
        padding: '24px 16px',
    };

    // Responsive typography for main title and subtitle
    const title = {
        ...styles.mainTitleStyle,
        color: colors.text,
        textAlign: 'center',
        margin: '8px 0 6px',
    };

    const subtitle = {
        ...styles.subtitleStyle,
        textAlign: 'center',
        maxWidth: 980,
        margin: '0 auto 16px',
    };

    const pills = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        margin: '10px 0 20px',
    };

    const pillText = {
        fontSize: 'clamp(16px, 2.0vw, 18px)',
        fontWeight: 600,
    };

    const grid = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
    };

    const cardTitle = {
        marginTop: 0,
        fontSize: 'clamp(18px, 2.6vw, 24px)',
        fontWeight: 700,
    };

    const cardIntroText = {
        fontSize: 'clamp(16px, 2.0vw, 18px)',
        lineHeight: 1.5,
        marginTop: 8,
        marginBottom: 8,
    };

    const cardListTitle = {
        display: 'block',
        marginTop: 6,
        fontSize: 'clamp(16px, 2.0vw, 18px)',
    };

    const cardList = {
        marginTop: 10,
        paddingLeft: 22,
        fontSize: 'clamp(14px, 2.0vw, 18px)',
    };

    const cardListItem = {
        marginBottom: 6,
        lineHeight: 1.45,
    };

    const footerText = {
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 24,
        fontSize: 'clamp(12px, 1.6vw, 14px)',
    };

    return (
            <div style={page}>
                <Header
                        ref={headerRef}
                        showBack
                        backLabel="Back"
                        onNavigate={(arg) => {
                            if (arg === 'back') {
                                // Navigate back to Tic-Tac-Toe settings and keep resume flags
                                return navigate('/tic-tac-toe', {
                                    state: { resume: true, from: 'strategy' },
                                });
                            }
                            navigate(String(arg || '/'));
                        }}
                />

                <UnderHeader headerRef={headerRef} center={false} scrollY="auto">
                    <div style={wrap}>
                        <h1 style={title}>Tic-tac-toe game strategy</h1>
                        <p style={subtitle}>{lead}</p>

                        {/* Tab selector (pills) */}
                        <div style={pills}>
                            <Pill active={tab === 'overview'} onClick={() => setTab('overview')}>
                                <span style={pillText}>Overview</span>
                            </Pill>
                            <Pill active={tab === 'forks'} onClick={() => setTab('forks')}>
                                <span style={pillText}>Forks &amp; Blocks</span>
                            </Pill>
                            <Pill active={tab === 'algo'} onClick={() => setTab('algo')}>
                                <span style={pillText}>Calculating the best move</span>
                            </Pill>
                        </div>

                        {/* Two cards in a responsive grid layout */}
                        <section style={grid}>
                            <Card>
                                <h3 style={cardTitle}>{content.leftTitle}</h3>
                                {content.leftIntro && <p style={cardIntroText}>{content.leftIntro}</p>}
                                {content.leftListTitle && (
                                        <strong style={cardListTitle}>{content.leftListTitle}</strong>
                                )}
                                {content.leftList && (
                                        <ol style={cardList}>
                                            {content.leftList.map((t, i) => (
                                                    <li key={i} style={cardListItem}>
                                                        {t}
                                                    </li>
                                            ))}
                                        </ol>
                                )}
                            </Card>

                            <Card>
                                <h3 style={cardTitle}>{content.rightTitle}</h3>
                                <ol style={cardList}>
                                    {content.rightList.map((t, i) => (
                                            <li key={i} style={cardListItem}>
                                                {t}
                                            </li>
                                    ))}
                                </ol>
                            </Card>
                        </section>

                        <div style={footerText}>©2025, All rights reserved</div>
                    </div>
                </UnderHeader>
            </div>
    );
}
