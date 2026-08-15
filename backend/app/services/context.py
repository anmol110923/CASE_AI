from app.models.schemas import Turn


def split_window(turns: list[Turn], window_exchanges: int) -> tuple[list[Turn], list[Turn]]:
    """Split full transcript into older turns vs last N interviewer/candidate exchanges."""
    keep = max(window_exchanges, 1) * 2
    if len(turns) <= keep:
        return [], turns
    return turns[:-keep], turns[-keep:]
