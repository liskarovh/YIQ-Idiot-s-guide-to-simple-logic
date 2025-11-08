import { useGameOptions } from "../models/SettingsModel";

export const useOptionsController = () => {
  const { options, setOptions } = useGameOptions();

  const handleOptionChange = (name, value) => {
    setOptions((prev) => ({ ...prev, [name]: value }));
  };

  return { options, handleOptionChange };
};
