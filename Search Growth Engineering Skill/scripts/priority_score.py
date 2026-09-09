#!/usr/bin/env python3
"""Compute a practical priority score for Search Growth recommendations."""
import json, sys

def score(item):
    impact = int(item.get("impact", 1))
    business = int(item.get("businessValue", 1))
    confidence = int(item.get("confidence", 1))
    urgency = int(item.get("urgency", 1))
    effort = max(int(item.get("effort", 1)), 1)
    return ((impact * business * confidence) + urgency) / effort

if __name__ == "__main__":
    data = json.load(sys.stdin)
    if isinstance(data, list):
        for x in data:
            x["priorityScore"] = round(score(x), 2)
        data.sort(key=lambda x: x["priorityScore"], reverse=True)
    else:
        data["priorityScore"] = round(score(data), 2)
    json.dump(data, sys.stdout, indent=2)
    print()
