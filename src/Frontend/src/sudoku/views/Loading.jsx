import Box from "../../components/Box";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";

function Loading() {
  const navigate = useNavigate();

  return (
     <Box width={200} height={200} title={"Loading..."}
     ></Box>
  );
}

export default Loading;