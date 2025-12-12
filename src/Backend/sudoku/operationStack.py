class OperationStack:
    def __init__(self):
        self.history = []

    def to_dict(self):
        return self.history

    def update_from_list(self, history_list):
        if isinstance(history_list, list):
            self.history = history_list

    @classmethod
    def from_list(cls, history_list):
        stack = cls()
        if history_list is not None:
            stack.history = history_list
        return stack