/**
 * @file SettingsLoader.jsx
 * @brief A loading component for Minesweeper settings.
 *
 * @author Jan Kalina \<xkalinj00>
 */

import React from "react";
import Box from "../../../components/Box";
import Loader from "../../../components/Loader";
import colors from "../../../Colors";

function SettingsLoader() {
    const card = {
        boxSizing: 'border-box',
        borderRadius: 'clamp(20px, 3vw, 40px)',
        background: '#0F172A',
        padding: 'clamp(18px, 2.8vw, 24px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(16px, 2.5vw, 20px)',
        minHeight: 'clamp(200px, 30vw, 300px)'
    };

    const textStyle = {
        color: colors.text,
        fontSize: 'clamp(16px, 2.5vw, 20px)'
    };

    return (
            <Box style={card}>
                <span><Loader size={60} /></span>
                <span style={textStyle}>Loading default settings...</span>
            </Box>
    );
}

export default SettingsLoader;
