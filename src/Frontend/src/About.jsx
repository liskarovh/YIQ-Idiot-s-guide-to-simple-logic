/**
 * @file AboutPage.jsx
 * @brief About page for yIQ (mini-games collection).
 *
 * @author  Hana Liškařová xliskah00
 * @date    2025-12-12
 */

import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from './components/Header';
import styles from './Styles';
import colors from './Colors';

// Local UI components
import Card from './tic_tac_toe/react/components/card.jsx';
import UnderHeader from './tic_tac_toe/react/components/underHeader.jsx';

// Shared component
import Person from './components/Person.jsx';

export default function AboutPage() {
    const navigate = useNavigate();
    const headerRef = useRef(null);

    const aboutText =
            'yIQ is a small student-built collection of logical mini-games (Sudoku, Tic-Tac-Toe, Minesweeper) designed to make learning basic logic accesible and aproachable with clean UI and useful tutorials and features.';

    const team = useMemo(
            () => [
                { name: 'Honza Kalina', github: 'https://github.com/Honziksick', initial: 'H' },
                { name: 'David Krejčí', github: 'https://github.com/DJmDavidus', initial: 'D' },
                { name: 'Hanka Liškařová', github: 'https://github.com/liskarovh', initial: 'H' },
            ],
            []
    );

    const qrSrc = '/buy-us-a-coffee-qr.png';

    const page = { ...styles.container, alignItems: 'stretch', padding: 0 };

    const wrap = {
        width: 'min(1280px, 92vw)',
        margin: '0 auto',
        padding: '24px 16px',
    };

    const title = {
        ...styles.mainTitleStyle,
        color: colors.text,
        textAlign: 'center',
        margin: '10px 0 10px',
    };

    const subtitle = {
        ...styles.subtitleStyle,
        textAlign: 'center',
        maxWidth: 1020,
        margin: '0 auto 26px',
        lineHeight: 1.55,
    };

    const grid = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 24,
        alignItems: 'stretch',
    };

    const cardHeader = {
        textAlign: 'center',
        fontSize: 'clamp(22px, 2.8vw, 30px)',
        fontWeight: 800,
        margin: '0 0 18px',
    };

    const teamList = {
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        marginTop: 40,
    };

    const buyText = {
        textAlign: 'center',
        fontSize: 'clamp(16px, 2.0vw, 18px)',
        lineHeight: 1.55,
        opacity: 0.9,
        margin: '0 auto 18px',
        maxWidth: 520,
    };

    const qrWrap = {
        display: 'flex',
        justifyContent: 'center',
        marginTop: 6,
    };

    const qrFrame = {
        background: '#ffffff',
        borderRadius: 22,
        padding: 18,
        width: 'min(320px, 80vw)',
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
    };

    const qrImg = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        borderRadius: 14,
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
                            if (arg === 'back') return navigate(-1);
                            navigate(String(arg || '/'));
                        }}
                />

                <UnderHeader headerRef={headerRef} center={false} scrollY="auto">
                    <div style={wrap}>
                        <h1 style={title}>About yIQ</h1>
                        <p style={subtitle}>{aboutText}</p>

                        <section style={grid}>
                            <Card>
                                <h2 style={cardHeader}>Team members</h2>

                                <div style={teamList}>
                                    {team.map((p) => (
                                            <Person
                                                    key={p.github}
                                                    name={p.name}
                                                    initial={p.initial}
                                                    href={p.github}
                                            />
                                    ))}
                                </div>
                            </Card>

                            <Card>
                                <h2 style={cardHeader}>Buy us a coffee</h2>
                                <p style={buyText}>
                                    Or a monster. If you like our work you can support the struggling
                                    developes here:
                                </p>

                                <div style={qrWrap}>
                                    <div style={qrFrame}>
                                        <img
                                                src={qrSrc}
                                                alt="Support QR"
                                                style={qrImg}
                                                draggable={false}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        </section>

                        <div style={footerText}>©2025, All rights reserved</div>
                    </div>
                </UnderHeader>
            </div>
    );
}
