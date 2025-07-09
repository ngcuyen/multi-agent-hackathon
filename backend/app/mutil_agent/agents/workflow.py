from typing import Any

from app.mutil_agent.agents.graph import get_graph


class BaseWorkflow:
    def __init__(self, state):
        self.state = state

        self.graph_builder = get_graph(state=state)

    def add_node(self, node_name: str, agent_node: Any):
        self.graph_builder.add_node(node_name, agent_node)

    def add_edge(self, source_node: str, target_node: str):
        self.graph_builder.add_edge(source_node, target_node)

    def add_conditional_edges(self, source: str, path: Any):
        self.graph_builder.add_conditional_edges(source, path)

    def get_graph(self):
        return self.graph_builder
