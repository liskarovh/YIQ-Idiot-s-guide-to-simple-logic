"""
@file operationStack.py
@brief A simple stack implementation to manage a history of operations, primarily
       for undo/redo functionality in a Sudoku game.

@author David Krejčí <xkrejcd00>
"""
from typing import List, Dict, Any

class OperationStack:
    """
    @brief Holds and manages the history of operations performed during a game session.
    """
    def __init__(self):
        """
        @brief Initializes a new, empty history stack.
        """
        self.history: List[Dict[str, Any]] = []

    def to_dict(self) -> List[Dict[str, Any]]:
        """
        @brief Converts the operation history stack into a list for serialization.
        @returns {List[Dict[str, Any]]} The list representing the operation history.
        """
        return self.history

    def update_from_list(self, history_list: List[Dict[str, Any]]):
        """
        @brief Updates the internal history stack from a provided list.
        @param history_list: List containing the new operation history.
        """
        if isinstance(history_list, list):
            self.history = history_list

    @classmethod
    def from_list(cls, history_list: List[Dict[str, Any]]):
        """
        @brief Creates an OperationStack instance from a serialized list.
        @param history_list: List containing the operation history.
        @returns {OperationStack} A new OperationStack instance populated with the history.
        """
        stack = cls()
        if history_list is not None:
            stack.history = history_list
        return stack