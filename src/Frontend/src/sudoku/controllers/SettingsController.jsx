/**
 * @file SettingsController.jsx
 * @brief Controller hook for interacting with and modifying the user's game options and preferences stored in the SettingsModel.
 *
 * @author David Krejčí <xkrejcd00>
 */
import { useGameOptions } from "../models/SettingsModel";

/**
 * @brief Hook that provides access to the game options and a centralized function to update them.
 * @returns {object} Object containing the current `options` and the `handleOptionChange` function.
 */
export const useOptionsController = () => {
  const { options, setOptions } = useGameOptions();

  /**
   * @brief Updates a single option key-value pair in the SettingsModel state.
   * @param {string} name - The key of the option to update.
   * @param {*} value - The new value for the option.
   */
  const handleOptionChange = (name, value) => {
    setOptions((prev) => ({ ...prev, [name]: value }));
  };

  return { options, handleOptionChange };
};