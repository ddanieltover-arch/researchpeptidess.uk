from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from intelligence.pilots import REGRESSION_FLOOR, count_regression_tests


def main(root: str | None = None) -> int:
    base = Path(root or Path(__file__).resolve().parent.parent / 'intelligence')
    total = count_regression_tests(base)
    print(f'regression_tests={total} floor={REGRESSION_FLOOR}')
    if total < REGRESSION_FLOOR:
        print(f'FAIL: test count dropped below v2.1.1 baseline of {REGRESSION_FLOOR}')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else None))
