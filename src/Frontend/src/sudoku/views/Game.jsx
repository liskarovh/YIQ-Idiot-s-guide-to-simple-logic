import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, pointerWithin } from '@dnd-kit/core';
import Header from "../../components/Header";
import SudokuGrid from "../components/Grid";
import { useSudokuNavigation } from "../controllers/NavigationController";
import { useGameController, useNewGame } from "../controllers/GameController"; 
import NumberSelector from "../components/NumberSelect";
import Box from "../../components/Box"
import IconButton from "../../components/IconButton";
import { Eye, Sparkles, Undo, Eraser, StickyNote, BookOpen, Settings, Pointer, Play, Home } from "lucide-react";
import useMeasure from "react-use-measure";
import colors from "../../Colors";
import { useMemo, useState } from "react";

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  touchAction: 'none', 
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
  gap: '2rem', 
  padding: '7rem 2rem 2rem 2rem', 
  flex: 1,
  minHeight: 0,
};

const gameInfoStyle = {
  color: colors.text,
  fontSize: '15cqmin',
  fontWeight: 'bold',
  marginBottom: '2cqh', 
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

const snapCenterAndShiftUp = ({ transform, activatorEvent, draggingNodeRect }) => {
  if (!activatorEvent || !draggingNodeRect) {
    return transform;
  }
  const startX = activatorEvent.clientX ?? activatorEvent.x ?? 0;
  const startY = activatorEvent.clientY ?? activatorEvent.y ?? 0;
  const elementCenterX = draggingNodeRect.left + draggingNodeRect.width / 2;
  const elementCenterY = draggingNodeRect.top + draggingNodeRect.height / 2;
  const offsetX = startX - elementCenterX;
  const offsetY = startY - elementCenterY;
  
  return {
    ...transform,
    x: transform.x + offsetX, 
    y: transform.y + offsetY - 30,
  };
};

function Game() {
  const [ref, bounds] = useMeasure();
  const [gridRef, gridBounds] = useMeasure();
  const { setRelativeView, goBack } = useSudokuNavigation();
  const { newGame } = useNewGame(); 
  
  const {
    gridData, selectedCell, selectedNumber, eraseOn, notesOn, inputMethod,
    mode, difficulty, timer, mistakes, completedNumbers, highlightNumbers, highlightAreas,
    gameStatus, hintHighlights,
    cellClicked, numberClicked, smartHintClicked, revealHintClicked, dismissStatus,
    undoClicked, eraseClicked, notesClicked, inputClicked, dragInput
  } = useGameController()

  const isVictory = gameStatus?.type === 'completed';

  const isMobile = useMemo(() => {
    if (!bounds.width || !bounds.height) return false;
    return bounds.width < 1000 || bounds.width < bounds.height * 1.2; 
  }, [bounds.width, bounds.height]);

  const { iconSize, buttonFontSize } = useMemo(() => {
    if (!bounds.width) return { iconSize: 24, buttonFontSize: "1rem" };
    const iSize = Math.max(12, Math.min(28, bounds.width / 22));
    const fSizeRaw = Math.max(12, Math.min(20, bounds.width / 50));
    return { iconSize: iSize, buttonFontSize: `${fSizeRaw}px` };
  }, [bounds.width]);

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

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    })
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null); 

    if (!over) return;

    const numberDropped = active.id;
    const [_, row, col] = over.id.split('-'); 

    dragInput(Number(numberDropped), Number(row), Number(col));
  }

  function Info() {
    const renderStatusContent = (fontSize) => {
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
      return <></>;
    };

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

    const desktopBoxStyle = {
      padding: '2rem', 
      boxSizing: 'border-box',
      height: gridSize,
      width: infoWidth,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      containerType: 'inline-size', 
    };
    
    const desktopTitleStyle = { ...gameInfoStyle, fontSize: '12cqi', marginBottom: 0, textAlign: 'center' };
    const desktopLabelStyle = { ...whiteTextStyle, fontSize: '7cqi', margin: '0.5cqi' };
    const desktopTimerStyle = { ...timeStyle, fontSize: '15cqi', marginTop: 0, marginBottom: 0 };
    
    return (
      <Box width={infoWidth} height={gridSize} style={desktopBoxStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <div style={{ flex: 1 }} /> 
            <span style={desktopTitleStyle}>Game Info</span>
            <div style={{ flex: 0.5 }} /> 
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={desktopLabelStyle}>Mode: {mode}</span>
              <span style={desktopLabelStyle}>Difficulty: {difficulty}</span>
            </div>
            <div style={{ flex: 0.5 }} /> 
            <Timer customStyle={desktopTimerStyle}/>
            <div style={{ flex: 1 }} /> 
          </div>
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

  function Controls() {
    if (isVictory) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%', 
          gap: '2rem' 
        }}>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Home} description="Menu" onClick={goBack}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Play} description="New Game" onClick={newGame}/>
          <IconButton size={iconSize} fontSize={buttonFontSize} icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
            <IconButton size={iconSize} fontSize={buttonFontSize} icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
        </div>
      );
    }

    return (
      <>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={Eye} description="Reveal Cell" onClick={revealHintClicked}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={Sparkles} description="Smart Hint" onClick={smartHintClicked}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={Undo} description="Undo" onClick={undoClicked}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={Eraser} description={getDescriptions().erase} onClick={eraseClicked}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={StickyNote} description={getDescriptions().notes} onClick={notesClicked}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
        <IconButton size={iconSize} fontSize={buttonFontSize} icon={Pointer} description={getDescriptions().inputMethod} onClick={inputClicked}/>
      </>
    );
  }

  // --- DRAG OVERLAY STYLE UPDATE ---
  // Matches the new "Selected" style in NumberSelect.jsx
  const dragOverlayStyle = {
    width: '60px', 
    height: '60px', 
    backgroundColor: '#d8e0eb', // Unified Light Blue/White
    color: '#0f172a', // Dark Text
    borderRadius: '12px', // Rounded corners
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 'bold',
    boxShadow: '0 10px 20px rgba(0,0,0,0.3)', // deeper shadow for lifting effect
    opacity: 0.95,
  };

  if (isMobile) {
    const actualGridHeight = gridBounds.width || 0;
    
    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
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
              
              {!isVictory && (
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
              )}
            </div>
            
            <div style={{ gridRow: '3', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Controls />
            </div>
          </div>
          <DragOverlay dropAnimation={null} modifiers={[snapCenterAndShiftUp]}>
            {activeId ? (
              <div style={{...dragOverlayStyle, width: '50px', height: '50px'}}>
                {activeId}
              </div>
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    );
  }

  // Desktop
  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
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
            {!isVictory && (
              <NumberSelector
                selectedNumber={selectedNumber}
                onNumberSelect={numberClicked}
                isColumn={true}
                completedNumbers={completedNumbers}
                style={{ height: gridSize, width: numberSelectorWidth }}
              />
            )}
          </div>
          
          <div style={{ gridColumn: '1 / 5', gridRow: '2', minHeight: 0 }}></div>
          
          <div style={buttonsCellStyle}>
            <Controls />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterAndShiftUp]}>
        {activeId ? (
          <div style={dragOverlayStyle}>
            {activeId}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default Game;