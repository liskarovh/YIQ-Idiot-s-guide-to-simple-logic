# React + Python ITU project setup

- [Tam"xkalinj00"](#team-xkalinj00)
- [General Project Structure](#general-project-structure)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running Both Servers](#running-both-servers)
- [Detailed Project Structure Based on Authorship](#detailed-project-structure-based-on-authorship)

## Team xkalinj00

- Jan Kalina (xkalinj00)
- David Krejčí (xkrejcd00)
- Hana Liškařová (xliskah00)

## General Project Structure

```
project-root/
├── .gitignore
├── README.md
├── azure-frontend-pipeline.yml
├── azure-pipelines.yml
├── package.json
├── requirements.txt
└── src/
    ├── Backend/
    │   └── app.py
    └── Frontend/
        ├── public/
        │   └── index.html
        ├── src/
        │   ├── App.jsx
        │   └── index.js
        └── package.json
```

> Note: Detailed strcture is located under chapter "Local Development Setup"

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

1. Create a virtual environment (from project root):
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

Navigate to frontend directory and install dependencies:
```bash
cd src/Frontend
npm install
```

## Running Both Servers

Open two terminal windows from the project root:

**Terminal 1 (Backend):**
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
cd src/Backend
python app.py
```
Backend will run on `http://localhost:5000`

**Terminal 2 (Frontend):**
```bash
cd src/Frontend
npm start
```

Visit `http://localhost:3000` to see the app.

## Detailed Project Structure Based on Authorship

- <span style="color:turquoise">Jan Kalina (xkalinj00)</span>
- <span style="color:moccasin">David Krejčí (xkrejcd00)</span>
- <span style="color:lightpink">Hana Liškařová (xliskah00)</span>
- Rest are collaborative works

<pre>
Frontend/
├── <span style="color:lightpink">About.jsx</span>
├── App.jsx
├── package.json
├── public
│   └── index.html
└── src
    ├── assets
    │   ├── home
    │   │   ├── <span style="color:turquoise">MinesweeperIcon.svg</span>
    │   │   ├── <span style="color:turquoise">SudokuIcon.svg</span>
    │   │   └── <span style="color:turquoise">TicTacToeIcon.svg</span>
    │   ├── icons
    │   │   ├── <span style="color:turquoise">DragAFlagIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">HintIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">PauseIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">PlayIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">QuickFlagOffIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">QuickFlagOnIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">RestartIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">ResumeIcon.jsx</span>
    │   │   ├── <span style="color:turquoise">StrategyIcon.jsx</span>
    │   │   └── <span style="color:turquoise">UndoIcon.jsx</span>
    │   ├── minesweeper
    │   │   ├── <span style="color:turquoise">About</span>
    │   │   ├── <span style="color:turquoise">AdvancedLogic</span>
    │   │   ├── <span style="color:turquoise">AdvancedPatterns</span>
    │   │   ├── <span style="color:turquoise">BasicPatterns</span>
    │   │   ├── <span style="color:turquoise">BlackHeart.jsx</span>
    │   │   ├── <span style="color:turquoise">Efficiency</span>
    │   │   ├── <span style="color:turquoise">FlaggedCellTexture.jsx</span>
    │   │   ├── <span style="color:turquoise">FlaggingModeCellTexture.jsx</span>
    │   │   ├── <span style="color:turquoise">Flag.jsx</span>
    │   │   ├── <span style="color:turquoise">Guessing</span>
    │   │   ├── <span style="color:turquoise">Mine.jsx</span>
    │   │   ├── <span style="color:turquoise">NoFlag</span>
    │   │   ├── <span style="color:turquoise">PatternReduction</span>
    │   │   ├── <span style="color:turquoise">RedHeart.jsx</span>
    │   │   └── <span style="color:turquoise">UnopenedCellTexture.jsx</span>
    │   └── tic_tac_toe
    │       ├── <span style="color:lightpink">back.svg</span>
    │       ├── <span style="color:lightpink">bestmove.svg</span>
    │       ├── <span style="color:lightpink">info.svg</span>
    │       ├── <span style="color:lightpink">newgame.svg</span>
    │       ├── <span style="color:lightpink">pause.svg</span>
    │       ├── <span style="color:lightpink">restart.svg</span>
    │       ├── <span style="color:lightpink">settings.svg</span>
    │       └── <span style="color:lightpink">shutdown.svg</span>
    ├── Colors.jsx
    ├── components
    │   ├── <span style="color:turquoise">Banner.jsx</span>
    │   ├── <span style="color:turquoise">BoxButton.jsx</span>
    │   ├── <span style="color:moccasin">Box.jsx</span>
    │   ├── <span style="color:moccasin">ButtonSelect.jsx</span>
    │   ├── <span style="color:turquoise">GameCard.jsx</span> <span style="color:moccasin">(+David Krejčí)</span>
    │   ├── <span style="color:moccasin">Header.jsx</span> <span style="color:turquoise">(+Jan Kalina)</span>
    │   ├── <span style="color:moccasin">IconButton.jsx</span>
    │   ├── <span style="color:moccasin">IconTextButton.jsx</span>
    │   ├── <span style="color:turquoise">Loader.jsx</span>
    │   ├── <span style="color:turquoise">NumberField.jsx</span>
    │   ├── <span style="color:lightpink">Person.jsx</span>
    │   ├── <span style="color:moccasin">SettingsRow.jsx</span>
    │   ├── <span style="color:turquoise">Slider.jsx</span>
    │   └── <span style="color:turquoise">ToggleButton.jsx</span>
    ├── Home.jsx
    ├── hooks
    │   ├── <span style="color:turquoise">ImageUrlCache.js</span>
    │   └── <span style="color:turquoise">RenderImage.jsx</span>
    ├── index.js
<div style="color:turquoise">
    ├── minesweeper
    │   ├── components
    │   │   ├── MinesweeperCommonComponents
    │   │   │   ├── MinesweeperBoxButton.jsx
    │   │   │   ├── MinesweeperButtonSelect.jsx
    │   │   │   ├── MinesweeperInfoPanel.jsx
    │   │   │   ├── MinesweeperNumberField.jsx
    │   │   │   ├── MinesweeperSettingsRow.jsx
    │   │   │   ├── MinesweeperSlider.jsx
    │   │   │   └── MinesweeperToggleButton.jsx
    │   │   ├── MinesweeperGameComponents
    │   │   │   ├── ActionBar.jsx
    │   │   │   ├── ActionButton.jsx
    │   │   │   ├── ActionPill.jsx
    │   │   │   ├── GameInfoPanel.jsx
    │   │   │   ├── GameLayout.jsx
    │   │   │   ├── GameLoader.jsx
    │   │   │   ├── GameOverControls.jsx
    │   │   │   ├── HintOverlay.jsx
    │   │   │   ├── LostOnControls.jsx
    │   │   │   ├── MineCell.jsx
    │   │   │   ├── MineGrid.jsx
    │   │   │   ├── OverlayButton.jsx
    │   │   │   └── PanZoomViewport.jsx
    │   │   ├── MinesweeperSettingsComponents
    │   │   │   ├── DifficultyRow.jsx
    │   │   │   ├── GameBasicsPanel.jsx
    │   │   │   ├── GameplayPanel.jsx
    │   │   │   ├── SettingsLayout.jsx
    │   │   │   ├── SettingsLoader.jsx
    │   │   │   ├── SliderWithNumberControl.jsx
    │   │   │   └── ToggleRow.jsx
    │   │   └── MinesweeperStrategyComponents
    │   │       ├── StrategyBox.jsx
    │   │       └── StrategyPill.jsx
    │   ├── controllers
    │   │   ├── MinesweeperApiController.jsx
    │   │   ├── MinesweeperGameController.jsx
    │   │   ├── MinesweeperSettingsController.jsx
    │   │   └── MinesweeperStrategyController.jsx
    │   ├── hooks
    │   │   ├── MinesweeperGameHooks.jsx
    │   │   └── UseMediaQuery.js
    │   ├── models
    │   │   ├── MinesweeperApiClient.jsx
    │   │   ├── MinesweeperGame
    │   │   │   ├── MinesweeperGameAPI.jsx
    │   │   │   └── MinesweeperGameRenderHelpers.jsx
    │   │   ├── MinesweeperSettings
    │   │   │   ├── MinesweeperSettingsAPI.jsx
    │   │   │   ├── MinesweeperSettingsBuilders.jsx
    │   │   │   └── MinesweeperSettingsState.jsx
    │   │   └── MinesweeperStorageKeys.jsx
    │   ├── styles
    │   │   ├── MinesweeperGameStyles.jsx
    │   │   ├── MinesweeperSettingsStyles.jsx
    │   │   └── MinesweeperStrategyStyles.jsx
    │   └── views
    │       ├── MinesweeperGameView.jsx
    │       ├── MinesweeperSettingsView.jsx
    │       └── MinesweeperStrategyView.jsx
</div>
    ├── Styles.jsx
<div style="color:moccasin">
    ├── sudoku
    │   ├── components
    │   │   ├── Grid.jsx
    │   │   └── NumberSelect.jsx
    │   ├── controllers
    │   │   ├── GameController.jsx
    │   │   ├── NavigationController.jsx
    │   │   ├── SettingsController.jsx
    │   │   └── SudokuController.jsx
    │   ├── models
    │   │   ├── APIMappers.js
    │   │   ├── GameInfoModel.jsx
    │   │   ├── GridModel.jsx
    │   │   ├── HistoryModel.jsx
    │   │   ├── ServerCommunicationModel.jsx
    │   │   ├── SettingsModel.jsx
    │   │   └── StatusModel.jsx
    │   ├── Sudoku.jsx
    │   └── views
    │       ├── Game.jsx
    │       ├── Loading.jsx
    │       ├── Selection.jsx
    │       ├── Settings.jsx
    │       └── Strategy.jsx
</div>
<div style="color:lightPink">
    └── tic_tac_toe
        ├── javascript
        │   ├── client.js
        │   ├── constants.js
        │   ├── env.js
        │   ├── package.json
        │   └── ttt.client.js
        ├── react
        │   ├── components
        │   │   ├── best_move
        │   │   │   ├── bestMoveHint.jsx
        │   │   │   └── bestMoveOverlay.jsx
        │   │   ├── board.jsx
        │   │   ├── card.jsx
        │   │   ├── connectOptions.jsx
        │   │   ├── icons
        │   │   │   ├── backIcon.jsx
        │   │   │   ├── bestMoveIcon.jsx
        │   │   │   ├── index.js
        │   │   │   ├── infoIcon.jsx
        │   │   │   ├── newGameIcon.jsx
        │   │   │   ├── pauseIcon.jsx
        │   │   │   ├── powerIcon.jsx
        │   │   │   ├── restartIcon.jsx
        │   │   │   └── settingsIcon.jsx
        │   │   ├── infoPanels
        │   │   │   ├── base
        │   │   │   │   ├── defeatInfoPanelBase.jsx
        │   │   │   │   ├── infoPanelBase.jsx
        │   │   │   │   └── winnerInfoPanelBase.jsx
        │   │   │   ├── drawInfoPanel.jsx
        │   │   │   ├── gameInfoPanel.jsx
        │   │   │   ├── loseInfoPanel.jsx
        │   │   │   ├── oWinInfoPanel.jsx
        │   │   │   ├── pvpInfoPanel.jsx
        │   │   │   ├── spectatorInfoPanel.jsx
        │   │   │   ├── timeRanOutPanel.jsx
        │   │   │   ├── winInfoPanel.jsx
        │   │   │   └── xWinInfoPanel.jsx
        │   │   ├── marks
        │   │   │   ├── markO.jsx
        │   │   │   └── markX.jsx
        │   │   ├── pill.jsx
        │   │   ├── playerBadge.jsx
        │   │   ├── resultStatsGrid.jsx
        │   │   ├── settings
        │   │   │   ├── numberBox.jsx
        │   │   │   ├── pillRadioRow.jsx
        │   │   │   ├── playersEditor.jsx
        │   │   │   ├── previewStatRow.jsx
        │   │   │   ├── settingsSliderRow.jsx
        │   │   │   └── settingsToolbar.jsx
        │   │   ├── toolbar
        │   │   │   ├── afterGameToolbar.jsx
        │   │   │   ├── toolbar.jsx
        │   │   │   └── toolbarLayout.jsx
        │   │   └── underHeader.jsx
        │   ├── hooks
        │   │   ├── gameContext.js
        │   │   ├── useGame.js
        │   │   ├── useInfoPanelLayout.js
        │   │   └── useMeasuredSliderWidth.js
        │   └── pages
        │       ├── GamePage.jsx
        │       ├── GameSettingsPage.jsx
        │       └── StrategyPage.jsx
        └── tic_tac_toe.jsx
</div>
</pre>
