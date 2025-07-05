from langgraph.graph import StateGraph


class Graph(StateGraph):
    def __init__(self, state):
        super().__init__(state_schema=state)


def get_graph(state):
    return Graph(state)
