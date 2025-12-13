import Header from "../../components/Header";
import SudokuGrid from "../components/Grid";
import { useSudokuNavigation } from "../controllers/NavigationController";
import { useGameController } from "../controllers/GameController";
import NumberSelector from "../components/NumberSelect";
import Box from "../../components/Box"
import IconButton from "../../components/IconButton";
import { Eye, Sparkles, Undo, Eraser, StickyNote, BookOpen, Settings, Pointer } from "lucide-react";
import useMeasure from "react-use-measure";
import colors from "../../Colors";
import { useMemo } from "react";

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
};

// Grid layout for desktop (wide screens)
const desktopGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  gridTemplateRows: 'minmax(0, 1fr) auto auto',
  gap: '1rem',
  padding: '7rem 2rem 3rem 2rem',
  flex: 1,
  minHeight: 0,
};

// Grid layout for mobile (narrow screens)
const mobileGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridTemplateRows: 'auto 1fr auto auto', 
  gap: '2rem', // Increased gap for separation between Info and Game
  padding: '7rem 2rem 2rem 2rem', // Increased side padding
  flex: 1,
  minHeight: 0,
};

const boxContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  justifyContent: 'space-between',
  containerType: 'size',
};

const gameInfoStyle = {
  color: colors.text,
  fontSize: '15cqmin',
  fontWeight: 'bold',
  marginBottom: '2cqh', // Reduced margin to shift things up
};

const whiteTextStyle = {
  color: "#FFFFFF",
  fontSize: '8cqmin',
  fontWeight: 'bold',
  margin: '1cqmin', 
};

const timeStyle = {
  color: "#FFFFFF",
  fontSize: '20cqmin',
  fontWeight: 'bold',
  marginTop: '2cqh', 
  marginBottom: '5cqh',
};

const hintTitleStyle = {
  color: "#FFFFFF",
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
};

const hintTextStyle = {
  color: "rgba(255, 255, 255, 0.9)",
  fontSize: '1.1rem',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
};

const hintButtonStyle = {
  backgroundColor: colors.primary,
  color: "#FFFFFF",
  border: 'none',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
  marginTop: '1rem',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  transition: 'transform 0.1s active',
};

const gridCellStyle = {
  gridColumn: '3',
  gridRow: '1',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: 0,
  minHeight: 0,
  aspectRatio: '1',
  maxHeight: '100%',
};

const numberSelectorCellStyle = {
  gridColumn: '4',
  gridRow: '1',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  minWidth: 0,
  minHeight: 0,
};

const buttonsCellStyle = {
  gridColumn: '3 / 5', 
  gridRow: '3',
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
};

const mobileGameAreaStyle = {
  display: 'flex',
  gap: '0.5rem', 
  justifyContent: 'center',
  alignItems: 'stretch', 
  width: '100%',
  height: '100%',
  minHeight: 0,
};

function Game() {
  const [ref, bounds] = useMeasure();
  const [gridRef, gridBounds] = useMeasure();
  const { setRelativeView, goBack } = useSudokuNavigation();
  const {
    gridData, selectedCell, selectedNumber, eraseOn, notesOn, inputMethod,
    mode, difficulty, timer, mistakes, completedNumbers, highlightNumbers, highlightAreas,
    gameStatus, hintHighlights,
    cellClicked, numberClicked, smartHintClicked, revealHintClicked, dismissStatus, undoClicked, eraseClicked, notesClicked, inputClicked,
  } = useGameController()

  // Determine if mobile layout based on aspect ratio
  const isMobile = useMemo(() => {
    if (!bounds.width || !bounds.height) return false;
    return bounds.width < 1000 || bounds.width < bounds.height * 1.2; 
  }, [bounds.width, bounds.height]);

  // Calculate dynamic sizes for Icons and Font
  const { iconSize, buttonFontSize } = useMemo(() => {
    if (!bounds.width) return { iconSize: 24, buttonFontSize: "1rem" };
    
    // Icon Size Calculation
    const iSize = Math.max(12, Math.min(28, bounds.width / 22));
    
    // Font Size Calculation
    const fSizeRaw = Math.max(12, Math.min(20, bounds.width / 50));
    
    return { 
      iconSize: iSize, 
      buttonFontSize: `${fSizeRaw}px` 
    };
  }, [bounds.width]);

  // Calculate responsive sizes based on grid actual size
  const { infoWidth, infoHeight, numberSelectorWidth, gridSize } = useMemo(() => {
    if (!gridBounds.width || !gridBounds.height) {
      return { infoWidth: 400, infoHeight: 600, numberSelectorWidth: 150, gridSize: 0 };
    }
    
    const gridSize = Math.min(gridBounds.width, gridBounds.height);
    const infoHeight = gridSize;
    const infoWidth = Math.min(400, Math.max(200, gridSize * 0.9));
    const numberSelectorWidth = Math.min(150, Math.max(100, gridSize * 0.25));
    
    return { infoWidth, infoHeight, numberSelectorWidth, gridSize };
  }, [gridBounds.width, gridBounds.height]);

  function getDescriptions() {
    let erase
    if (inputMethod === "Number") {
      erase = <>Erase<br />{eraseOn ? "ON" : "OFF"}</>
    } else {
      erase = <>Erase</>
    }
    return {
      erase: erase,
      notes: <>Notes<br />{notesOn ? "ON" : "OFF"}</>,
      inputMethod: <>Input Method<br />{inputMethod}</>
    }
  }

  function Timer({ customStyle }) {
    if (timer === null) return <></>;

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return <span style={customStyle || timeStyle}>{timeStr}</span>;
  }

  const statusContainerStyle = {
    width: '100%',
    paddingTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    height: '50%', 
    overflow: 'hidden',
  };

  const statusTextStyle = {
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: '1.4',
    textAlign: 'center',
    whiteSpace: 'pre-wrap',
  };

  function Info() {
    // --- STATUS LOGIC (Shared) ---
    const renderStatusContent = (fontSize) => {
      // Helper to apply dynamic font size
      const dynamicTextStyle = { ...statusTextStyle, fontSize: fontSize };

      if (gameStatus) {
        return (
          <>
            <div style={{...hintTitleStyle, fontSize: `calc(${fontSize} * 1.2)`, textAlign: 'center', marginBottom: '0.25rem'}}>
              {gameStatus.title}
            </div>
            <div style={{...dynamicTextStyle, flex: 1, overflowY: 'auto', padding: '0 0.5rem'}}>
              {gameStatus.text}
            </div>
            {gameStatus.dismissText && (
              <button 
                onClick={dismissStatus} 
                style={{...hintButtonStyle, marginTop: '0.5rem', padding: '6px', fontSize: fontSize, width: 'auto', alignSelf: 'center'}}
              >
                {gameStatus.dismissText}
              </button>
            )}
          </>
        );
      }
      
      // Default State
      return (
        <></>
      );
    };

    // --- MOBILE LAYOUT (Preserved) ---
    if (isMobile) {
      const mobileBoxStyle = {
        padding: '0.75rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '100%',
        margin: 0, 
        boxSizing: 'border-box', 
        height: 'auto', 
        minHeight: '80px',
        borderRadius: '15px',
        gap: '0.5rem'
      };
      
      const mobileStatsRowStyle = {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      };

      const mobileLabelStyle = { color: colors.text, fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.8, marginRight: '0.5rem' };
      const mobileValueStyle = { color: "#FFFFFF", fontSize: '1rem', fontWeight: 'bold' };
      const mobileTimerStyle = { color: "#FFFFFF", fontSize: '1.5rem', fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' };

      return (
        <Box width="100%" height="auto" style={mobileBoxStyle}>
          <div style={mobileStatsRowStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
               <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={mobileLabelStyle}>Mode:      </span>
                  <span style={mobileValueStyle}>{mode}</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'baseline' }}>
                  <span style={mobileLabelStyle}>Difficulty:</span>
                  <span style={mobileValueStyle}>{difficulty}</span>
               </div>
            </div>
            <Timer customStyle={mobileTimerStyle}/>
          </div>
          {(gameStatus) && (
            <div style={{ width: '100%', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               {renderStatusContent('0.9rem')}
            </div>
          )}
        </Box>
      )
    }

    // --- DESKTOP LAYOUT (Responsive cqi units) ---
    const desktopBoxStyle = {
      padding: '2rem', // Slightly larger padding
      boxSizing: 'border-box',
      height: gridSize,
      width: infoWidth,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      containerType: 'inline-size', // <--- CRITICAL: Allows cqi units to work
    };
    
    // cqi = 1% of the container's width. 
    // If width is 400px, 10cqi = 40px.
    const desktopTitleStyle = { ...gameInfoStyle, fontSize: '12cqi', marginBottom: 0, textAlign: 'center' };
    const desktopLabelStyle = { ...whiteTextStyle, fontSize: '7cqi', margin: '0.5cqi' };
    const desktopTimerStyle = { ...timeStyle, fontSize: '15cqi', marginTop: 0, marginBottom: 0 };
    const statusLabelStyle = { color: colors.text, fontSize: '4cqi', fontWeight: 'bold', textAlign: 'left' };

    return (
      <Box width={infoWidth} height={gridSize} style={desktopBoxStyle}>
          
          {/* Top Section: Distributed with spacers */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            
            {/* Spacer */}
            <div style={{ flex: 1 }} /> 

            <span style={desktopTitleStyle}>Game Info</span>
            
            <div style={{ flex: 0.5 }} /> {/* Small Spacer */}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={desktopLabelStyle}>Mode: {mode}</span>
              <span style={desktopLabelStyle}>Difficulty: {difficulty}</span>
            </div>

            <div style={{ flex: 0.5 }} /> {/* Small Spacer */}
            
            <Timer customStyle={desktopTimerStyle}/>

            {/* Spacer */}
            <div style={{ flex: 1 }} /> 
          </div>

          {/* Bottom Section: Status / Hints */}
          <div style={statusContainerStyle}>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 0
            }}>
              {renderStatusContent('4.5cqi')}
            </div>
          </div>
      </Box>
    )
  }

  if (isMobile) {
    const actualGridHeight = gridBounds.width || 0;
    
    return (
      <div style={pageStyle}>
        <Header showBack={true} onNavigate={goBack} />
        <div ref={ref} style={mobileGridStyle}>
          <div style={{ gridRow: '1' }}>
            <Info/>
          </div>
          
          <div style={{ gridRow: '2', ...mobileGameAreaStyle }}>
            <div ref={gridRef} style={{ 
              flex: '1 1 0', 
              minWidth: 0, 
              minHeight: 0, 
              display: 'flex', 
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}>
              <div style={{ 
                width: '100%',
                aspectRatio: '1',
                maxWidth: '100%',
                maxHeight: '100%',
              }}>
                <SudokuGrid 
                  gridData={gridData}
                  selectedCell={selectedCell}
                  onCellClick={cellClicked}
                  highlightedNumbers={highlightNumbers}
                  highlightedAreas={highlightAreas}
                  mistakes={mistakes}
                  hintHighlights={hintHighlights}
                />
              </div>
            </div>
            
            <NumberSelector
              selectedNumber={selectedNumber}
              onNumberSelect={numberClicked}
              isColumn={true}
              completedNumbers={completedNumbers}
              style={{ 
                height: `${actualGridHeight}px`, 
                width: `${gridBounds.width * 0.25}px`, 
                maxWidth: '16vw', 
                maxHeight: '100%' 
              }}
            />
          </div>
          
          <div style={{ gridRow: '3', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={Eye} description="Reveal Cell" onClick={revealHintClicked}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={Sparkles} description="Smart Hint" onClick={smartHintClicked}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={Undo} description="Undo" onClick={undoClicked}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={Eraser} description={getDescriptions().erase} onClick={eraseClicked}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={StickyNote} description={getDescriptions().notes} onClick={notesClicked}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={Pointer} description={getDescriptions().inputMethod} onClick={inputClicked}/>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={pageStyle}>
      <Header showBack={true} onNavigate={goBack} />
      <div ref={ref} style={desktopGridStyle}>
        <div style={{ gridColumn: '1', gridRow: '1' }}>
          <Info/>
        </div>
        
        <div style={gridCellStyle} ref={gridRef}>
          <div style={{ width: gridSize, height: gridSize }}>
            <SudokuGrid 
              gridData={gridData}
              selectedCell={selectedCell}
              onCellClick={cellClicked}
              highlightedNumbers={highlightNumbers}
              highlightedAreas={highlightAreas}
              mistakes={mistakes}
              hintHighlights={hintHighlights}
            />
          </div>
        </div>
        
        <div style={numberSelectorCellStyle}>
          <NumberSelector
            selectedNumber={selectedNumber}
            onNumberSelect={numberClicked}
            isColumn={true}
            completedNumbers={completedNumbers}
            style={{ height: gridSize, width: numberSelectorWidth }}
          />
        </div>
        
        <div style={{ gridColumn: '1 / 5', gridRow: '2', minHeight: 0 }}></div>
        
        <div style={buttonsCellStyle}>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Eye} description="Reveal Cell" onClick={revealHintClicked}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Sparkles} description="Smart Hint" onClick={smartHintClicked}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Undo} description="Undo" onClick={undoClicked}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Eraser} description={getDescriptions().erase} onClick={eraseClicked}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={StickyNote} description={getDescriptions().notes} onClick={notesClicked}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Pointer} description={getDescriptions().inputMethod} onClick={inputClicked}/>
        </div>
      </div>
    </div>
  );
}

export default Game;