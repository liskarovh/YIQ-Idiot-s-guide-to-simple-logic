import Header from "../../components/Header";
import { useSudokuNavigation } from "../controllers/NavigationController";

function Strategy() {
  const {goBack} = useSudokuNavigation()

  return (
      <Header showBack={true} onNavigate={goBack}/>
  );
}

export default Strategy;