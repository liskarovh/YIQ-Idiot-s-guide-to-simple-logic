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

const pageStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100vw',
  gap: '2rem',
};


const topContentStyle = {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: '7rem',
    alignItems: 'stretch',
    gap: '1rem',
    padding: '7rem 2rem 0rem 2rem',
    flex: 1,
  };

const rightItemsStyle = {
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'flex-start',
  height: '100%',
  gap: '1rem',
}

const bottomContentStyle = {
  display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    paddingBottom: '3rem',
    paddingRight: '2rem'
}

const boxContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 0', // Add some vertical padding
    containerType: 'size',
};

// **STYLES FOR TEXT ELEMENTS**
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




function Game() {
  const [ref, bounds] = useMeasure();
  const { setRelativeView, goBack } = useSudokuNavigation();
  const {
    gridData, selectedCell, selectedNumber, eraseOn, notesOn, inputMethod,
    mode, difficulty, timer, hintsUsed, mistakes, completedNumbers, highlightNumbers, highlightAreas,
    cellClicked, numberClicked, hintClicked, undoClicked, eraseClicked, notesClicked, inputClicked,
  } = useGameController()

  const iconRowStyle = {
    width: bounds.width,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '0.5rem',
  };

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
    return (
      <Box width={400} height={'auto'} style={boxContentStyle}>
        <span style={gameInfoStyle}>Game Info</span>
        <span style={whiteTextStyle}>Mode: {mode}</span>
        <span style={whiteTextStyle}>Difficulty: {difficulty}</span>
        <Timer timer={timer}/>
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

  
  return (
    <div style={pageStyle}>
      <Header showBack={true} onNavigate={goBack} />
      <div style={topContentStyle}>
        <Info/>
        <div ref={ref} style={rightItemsStyle}>
          <SudokuGrid 
            gridData={gridData}
            selectedCell={selectedCell}
            onCellClick={cellClicked}
            highlightedNumbers={highlightNumbers}
            highlightedAreas={highlightAreas}
            mistakes={mistakes}
          />
          <NumberSelector
            selectedNumber={selectedNumber}
            onNumberSelect={numberClicked}
            isColumn={true}
            completedNumbers={completedNumbers}
          />
        </div>
      </div>
      <div style={bottomContentStyle}>
        <div style={iconRowStyle}>
          <IconButton icon={Lightbulb} description="Hint" onClick={hintClicked}/>
          <IconButton icon={Undo} description="Undo" onClick={undoClicked}/>
          <IconButton icon={Eraser} description={getDescriptions().erase} onClick={eraseClicked}/>
          <IconButton icon={StickyNote} description={getDescriptions().notes} onClick={notesClicked}/>
          <IconButton icon={BookOpen} description="Strategy" onClick={() => setRelativeView("Strategy")}/>
          <IconButton icon={Settings} description="Settings" onClick={() => setRelativeView("Settings")}/>
          <IconButton icon={Pointer} description={getDescriptions().inputMethod} onClick={inputClicked}/>
        </div>
      </div>
      
    </div>
  );
}


export default Game;