import Header from "../../components/Header";
import SudokuGrid from "../components/Grid";
import { useSudokuNavigation } from "../controllers/NavigationController";
import { useGameController } from "../controllers/GameController";
import NumberSelector from "../components/NumberSelect";
import Box from "../../components/Box"
import IconButton from "../../components/IconButton";
import { Lightbulb, Undo, Eraser, StickyNote, BookOpen, Settings, Pointer } from "lucide-react";
import useMeasure from "react-use-measure";
import colors from "../../Colors";
import { useMemo } from "react";

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden', // Fixes entire screen overlay issues
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
  gridTemplateRows: 'auto 1fr auto auto', // Row 2 (1fr) takes available space
  gap: '1rem',
  padding: '7rem 1rem 2rem 1rem', // Reduced side padding slightly for mobile
  flex: 1,
  minHeight: 0,
};

const boxContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
  justifyContent: 'center',
  containerType: 'size',
};

const gameInfoStyle = {
  color: colors.text,
  fontSize: '15cqmin',
  fontWeight: 'bold',
  marginBottom: '10cqh',
};

const whiteTextStyle = {
  color: "#FFFFFF",
  fontSize: '8cqmin',
  fontWeight: 'bold',
  margin: '4cqmin',
};

const timeStyle = {
  color: "#FFFFFF",
  fontSize: '20cqmin',
  fontWeight: 'bold',
  marginTop: '15cqh',
  marginBottom: '10cqh',
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
  gap: '0.5rem', // Reduced gap for mobile
  justifyContent: 'center',
  alignItems: 'center',
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
    mode, difficulty, timer, hintsUsed, mistakes, completedNumbers, highlightNumbers, highlightAreas,
    cellClicked, numberClicked, hintClicked, undoClicked, eraseClicked, notesClicked, inputClicked,
  } = useGameController()

  // Determine if mobile layout based on aspect ratio
  const isMobile = useMemo(() => {
    if (!bounds.width || !bounds.height) return false;
    return bounds.width < 1000 || bounds.width < bounds.height * 1.2; 
  }, [bounds.width, bounds.height]);

  const iconSize = useMemo(() => {
    if (!bounds.width) return 24;
    return Math.max(16, Math.min(28, bounds.width / 13));
  }, [bounds.width]);

  // Calculate responsive sizes based on grid actual size
  const { infoWidth, infoHeight, numberSelectorWidth, gridSize } = useMemo(() => {
    if (!gridBounds.width || !gridBounds.height) {
      return { infoWidth: 400, infoHeight: 600, numberSelectorWidth: 150, gridSize: 600 };
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

  function Info() {
    const boxOverrideStyle = {
      padding: '1rem',
      boxSizing: 'border-box',
      height: isMobile ? 'auto' : gridSize,
      width: isMobile ? '100%' : infoWidth,
      flexShrink: 0,
    };
    
    return (
      <Box width={isMobile ? '100%' : infoWidth} height={isMobile ? 'auto' : gridSize} style={boxOverrideStyle}>
        <div style={boxContentStyle}>
          <span style={gameInfoStyle}>Game Info</span>
          <span style={whiteTextStyle}>Mode: {mode}</span>
          <span style={whiteTextStyle}>Difficulty: {difficulty}</span>
          <Timer timer={timer}/>
        </div>
      </Box>
    )
  }

  function Timer() {
    if (timer === null) return <></>;

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return <span style={timeStyle}>{timeStr}</span>;
  }

  if (isMobile) {
    return (
      <div style={pageStyle}>
        <Header showBack={true} onNavigate={goBack} />
        <div ref={ref} style={mobileGridStyle}>
          <div style={{ gridRow: '1' }}>
            <Info/>
          </div>
          
          <div style={{ gridRow: '2', ...mobileGameAreaStyle }}>
            {/* We add maxHeight: '100%' to prevent the aspect-ratio 
                from forcing the grid taller than the available row space.
            */}
            <div style={{ 
              flex: '1 1 0', 
              minWidth: 0, 
              minHeight: 0, 
              aspectRatio: '1', 
              maxHeight: '100%', 
              display: 'flex', 
              justifyContent: 'center' 
            }}>
              <SudokuGrid 
                gridData={gridData}
                selectedCell={selectedCell}
                onCellClick={cellClicked}
                highlightedNumbers={highlightNumbers}
                highlightedAreas={highlightAreas}
                mistakes={mistakes}
              />
            </div>
            <NumberSelector
              selectedNumber={selectedNumber}
              onNumberSelect={numberClicked}
              isColumn={true}
              completedNumbers={completedNumbers}
              style={{ height: '100%', width: 'auto', maxHeight: '100%' }}
            />
          </div>
          
          <div style={{ gridRow: '3', display: 'flex', justifyContent: 'center', gap: '1%' }}>
            <IconButton size={iconSize} icon={Lightbulb} description="Hint" onClick={hintClicked}/>
            <IconButton size={iconSize} icon={Undo} description="Undo" onClick={undoClicked}/>
            <IconButton size={iconSize} icon={Eraser} description={getDescriptions().erase} onClick={eraseClicked}/>
            <IconButton size={iconSize} icon={StickyNote} description={getDescriptions().notes} onClick={notesClicked}/>
            <IconButton size={iconSize} icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
            <IconButton size={iconSize} icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
            <IconButton size={iconSize} icon={Pointer} description={getDescriptions().inputMethod} onClick={inputClicked}/>
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
          <IconButton size={iconSize} icon={Lightbulb} description="Hint" onClick={hintClicked}/>
          <IconButton size={iconSize} icon={Undo} description="Undo" onClick={undoClicked}/>
          <IconButton size={iconSize} icon={Eraser} description={getDescriptions().erase} onClick={eraseClicked}/>
          <IconButton size={iconSize} icon={StickyNote} description={getDescriptions().notes} onClick={notesClicked}/>
          <IconButton size={iconSize} icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
          <IconButton size={iconSize} icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
          <IconButton size={iconSize} icon={Pointer} description={getDescriptions().inputMethod} onClick={inputClicked}/>
        </div>
      </div>
    </div>
  );
}

export default Game;