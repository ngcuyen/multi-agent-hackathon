class StreamingException(Exception):
    def __init__(
        self,
        node_name,
        code=400,
        message="",
    ):
        self.code = code
        self.message = message
        self.status = "error"
        self.node_name = node_name


class DefaultException(Exception):
    def __init__(self, message="", code=400):
        self.code = code
        self.message = message
        self.status = "error"
        self.node_name = ""
