import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

function Loading() {
  const navigate = useNavigate();

  return (
      <Header showBack={true} onNavigate={() => navigate("/")}/>
  );
}

export default Loading;