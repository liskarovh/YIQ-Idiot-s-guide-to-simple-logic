import colors from './Colors'

const styles = {
    container: {
        minHeight: '100vh',
        width: '100%',
        background: `linear-gradient(to bottom, 
        ${colors.secondary} 0%, 
        ${colors.primary} 20%, 
        ${colors.primary} 60%, 
        ${colors.secondary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    box: {
        backgroundColor: colors.secondary,
        boxShadow: '2px 4px 4px rgba(255, 255, 255, 0.25)',
        borderRadius: '1rem',
        overflow: 'hidden',
        width: '600px',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        padding: '1rem'
    },
    mainTitleStyle: {
        fontSize: '90px',
        fontWeight: '700',
        color: colors.text_header,
        margin: 0,
        lineHeight: '1.1',
    },
    subtitleStyle: {
        fontSize: '45px',
        fontWeight: '400',
        color: colors.text,
        margin: 0,
        lineHeight: '1.3',
    },
}

export default styles;