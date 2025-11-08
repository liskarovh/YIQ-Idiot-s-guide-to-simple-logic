import numpy as np
from sudoku.sudokuEnums import CellValue
import itertools


class Grid:
    """
    Memory-optimized Sudoku grid.
    Uses NumPy arrays for compact, fast storage:
      - values: 9x9 uint8 (0–9)
      - types:  9x9 uint8 (enum codes)
      - pencils: 9x9 uint16 (bitmask for pencil values)
    """

    __slots__ = ('values', 'types', 'pencils')

    def __init__(self):
        self.values = np.zeros((9, 9), dtype=np.uint8)    # Cell numbers (0–9)
        self.types = np.full((9, 9), CellValue.ENTERED, dtype=np.uint8)
        self.pencils = np.zeros((9, 9), dtype=np.uint16)  # 9 bits for pencil flags

    def get(self, col: int, row: int):
        """Return the value of a cell."""
        return self.values[row - 1, col - 1]

    def set(self, val: int, col: int, row: int, cell_type=None):
        """Set value and optionally type of a cell."""
        self.values[row - 1, col - 1] = val
        if cell_type is not None:
            self.types[row - 1, col - 1] = cell_type

    def set_pencil(self, set_flag: bool, val: int, col: int, row: int):
        """Set or clear a pencil value (1–9) using bitmask."""
        bit = 1 << (val - 1)
        if set_flag:
            self.pencils[row - 1, col - 1] |= bit
        else:
            self.pencils[row - 1, col - 1] &= ~bit

    def get_pencil(self, val: int, col: int, row: int) -> bool:
        """Check if a pencil mark is set."""
        return bool(self.pencils[row - 1, col - 1] & (1 << (val - 1)))

    def setup(self, cell_list: list[int]):
        """Initialize the grid from a flat list of 81 integers (0–9)."""
        arr = np.array(cell_list, dtype=np.uint8).reshape(9, 9)
        self.values[:] = arr
        self.types[arr > 0] = CellValue.STARTING

    def make_candidates(self):
        """
        Populate pencil marks (candidates) for each empty cell.
        Each pencil mask has bits 1–9 set if that value is *possible*.
        """
        ALL_PENCILS = 0x1FF  # 9 bits set (values 1–9)

        # 1️⃣ Set all empty cells to full candidates in one go
        self.pencils[:] = np.where(self.values == 0, ALL_PENCILS, 0)

        # 2️⃣ For each filled cell, remove its value from peers
        for r in range(9):
            for c in range(9):
                value = self.values[r, c]
                if value == 0:
                    continue
                bitmask = 0xFFFF ^ np.uint16(1 << (value - 1))  # XOR to flip the bit

                # Row and column elimination (vectorized)
                self.pencils[r, :] &= bitmask
                self.pencils[:, c] &= bitmask

                # Box elimination (vectorized)
                br = (r // 3) * 3
                bc = (c // 3) * 3
                self.pencils[br:br+3, bc:bc+3] &= bitmask

    #######################################################################################################
    #                   SOLVING
    #######################################################################################################


    def solve_naked_singles(self):
        """
        Fill in all naked singles:
        Cells with exactly one candidate bit set in their pencil mask.
        Returns the number of cells filled.
        """
        changed = 0

        # Find where there's exactly one bit set (power of two)
        single_mask = (self.pencils != 0) & ((self.pencils & (self.pencils - 1)) == 0)
        single_indices = np.argwhere(single_mask)

        for r, c in single_indices:
            bit = self.pencils[r, c]
            if bit == 0:  # Safety check
                continue
            value = int(np.log2(bit)) + 1  # convert bitmask → value 1–9
            self.values[r, c] = value
            self.types[r, c] = 1  # e.g. CellValue.ENTERED
            self.pencils[r, c] = 0
            changed += 1

            # Remove from peers
            bitmask = 0xFFFF ^ np.uint16(1 << (value - 1))
            self.pencils[r, :] &= bitmask
            self.pencils[:, c] &= bitmask
            br, bc = (r // 3) * 3, (c // 3) * 3
            self.pencils[br:br+3, bc:bc+3] &= bitmask

        return changed


    def solve_hidden_singles(self):
        """
        Find and fill hidden singles:
        A candidate that appears only once in a row, column, or box.
        Returns the number of cells filled.
        """
        changed = 0
        ALL_BITS = [1 << i for i in range(9)]

        for val_bit, val in zip(ALL_BITS, range(1, 10)):
            # --- Rows ---
            for r in range(9):
                mask = (self.pencils[r, :] & val_bit) > 0
                if np.sum(mask) == 1:
                    c = np.argmax(mask)
                    if self.values[r, c] == 0:
                        self.values[r, c] = val
                        self.types[r, c] = 1
                        self.pencils[r, c] = 0
                        changed += 1

                        # Remove from peers
                        bitmask = 0xFFFF ^ np.uint16(1 << (val - 1))
                        self.pencils[r, :] &= bitmask
                        self.pencils[:, c] &= bitmask
                        br, bc = (r // 3) * 3, (c // 3) * 3
                        self.pencils[br:br+3, bc:bc+3] &= bitmask

            # --- Columns ---
            for c in range(9):
                mask = (self.pencils[:, c] & val_bit) > 0
                if np.sum(mask) == 1:
                    r = np.argmax(mask)
                    if self.values[r, c] == 0:
                        self.values[r, c] = val
                        self.types[r, c] = 1
                        self.pencils[r, c] = 0
                        changed += 1

                        bitmask = 0xFFFF ^ np.uint16(1 << (val - 1))
                        self.pencils[r, :] &= bitmask
                        self.pencils[:, c] &= bitmask
                        br, bc = (r // 3) * 3, (c // 3) * 3
                        self.pencils[br:br+3, bc:bc+3] &= bitmask

            # --- Boxes ---
            for br in range(0, 9, 3):
                for bc in range(0, 9, 3):
                    box = self.pencils[br:br+3, bc:bc+3]
                    mask = (box & val_bit) > 0
                    if np.sum(mask) == 1:
                        idx = np.argwhere(mask)[0]
                        r, c = br + idx[0], bc + idx[1]
                        if self.values[r, c] == 0:
                            self.values[r, c] = val
                            self.types[r, c] = 1
                            self.pencils[r, c] = 0
                            changed += 1

                            bitmask = 0xFFFF ^ np.uint16(1 << (val - 1))
                            self.pencils[r, :] &= bitmask
                            self.pencils[:, c] &= bitmask
                            br2, bc2 = (r // 3) * 3, (c // 3) * 3
                            self.pencils[br2:br2+3, bc2:bc2+3] &= bitmask

        return changed
    

    def solve_hidden_sets(self, size=2):
        """
        Generic solver for hidden pairs/triplets/quads.
        size = 2 → hidden pairs
        size = 3 → hidden triplets
        size = 4 → hidden quads
        Returns number of eliminations made.
        """
        changed = 0
        digits = range(1, 10)
        bitmasks = np.array([1 << (d - 1) for d in digits], dtype=np.uint16)

        def process_unit(unit_coords):
            nonlocal changed
            # Extract pencil masks for this unit (list of (r, c))
            masks = np.array([self.pencils[r, c] for r, c in unit_coords])
            if not np.any(masks):
                return

            # For each digit, find which cells contain it
            positions = {
                d: {i for i, m in enumerate(masks) if m & (1 << (d - 1))}
                for d in digits
            }

            # Check all combinations of n digits
            for combo in itertools.combinations(digits, size):
                combined_cells = set.union(*(positions[d] for d in combo))
                if len(combined_cells) == size:
                    # Found a hidden set
                    keep_mask = sum(1 << (d - 1) for d in combo)
                    for idx in combined_cells:
                        r, c = unit_coords[idx]
                        before = self.pencils[r, c]
                        new_mask = before & keep_mask
                        if new_mask != before:
                            self.pencils[r, c] = new_mask
                            changed += 1

        # Process all 27 units (9 rows, 9 cols, 9 boxes)
        for r in range(9):
            process_unit([(r, c) for c in range(9)])       # row
        for c in range(9):
            process_unit([(r, c) for r in range(9)])       # column
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                process_unit([
                    (br + r, bc + c) for r in range(3) for c in range(3)
                ])                                         # box

        return changed
    

    def solve_naked_sets(self, size=2):
        """
        Generic solver for naked pairs/triplets/quads.
        size = 2 → naked pairs
        size = 3 → naked triplets
        size = 4 → naked quads
        Returns the number of eliminations made.
        """
        changed = 0

        def process_unit(unit_coords):
            nonlocal changed
            # Extract pencil masks for this unit
            masks = np.array([self.pencils[r, c] for r, c in unit_coords])
            # Filter nonempty cells (only those with candidates)
            nonempty = np.nonzero(masks)[0]
            if len(nonempty) < size:
                return
            masks = masks[nonempty]
            coords = [unit_coords[i] for i in nonempty]

            # Compare combinations of `size` cells
            for combo_idx in itertools.combinations(range(len(masks)), size):
                combo_masks = masks[list(combo_idx)]
                combined_mask = np.bitwise_or.reduce(combo_masks)
                # Check if the total number of bits == size (e.g. 2 bits for a pair)
                if bin(combined_mask).count("1") == size:
                    # Now, see if these same cells share exactly these candidates
                    match = np.all((combo_masks | combined_mask) == combined_mask)
                    if not match:
                        continue

                    # Naked set found: remove these digits from *other* cells in the unit
                    for i, (r, c) in enumerate(coords):
                        if i in combo_idx:
                            continue  # skip the naked cells
                        before = self.pencils[r, c]
                        new_mask = before & ~combined_mask
                        if new_mask != before:
                            self.pencils[r, c] = new_mask
                            changed += 1

        # Process all 27 Sudoku units (9 rows, 9 columns, 9 boxes)
        for r in range(9):
            process_unit([(r, c) for c in range(9)])       # Row
        for c in range(9):
            process_unit([(r, c) for r in range(9)])       # Column
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                process_unit([
                    (br + r, bc + c) for r in range(3) for c in range(3)
                ])                                         # Box

        return changed


    def solve_pointing_pairs(self):
        """
        Pointing pairs/triples (Box/Line Intersection):
        If a candidate in a box appears only in one row or column,
        eliminate it from the rest of that row/column outside the box.
        Returns the number of eliminations made.
        """
        changed = 0

        for val in range(1, 10):
            val_bit = np.uint16(1 << (val - 1))
            not_val_bit = 0xFFFF ^ val_bit

            # Check each 3x3 box
            for br in range(0, 9, 3):
                for bc in range(0, 9, 3):
                    # Find cells in this box that contain the candidate
                    box_cells = []
                    for r in range(br, br + 3):
                        for c in range(bc, bc + 3):
                            if self.pencils[r, c] & val_bit:
                                box_cells.append((r, c))

                    if len(box_cells) == 0:
                        continue

                    # Check if all candidates are in the same row
                    rows = {r for r, c in box_cells}
                    if len(rows) == 1:
                        row = rows.pop()
                        # Eliminate from rest of the row (outside this box)
                        for c in range(9):
                            if bc <= c < bc + 3:
                                continue  # Skip cells in the box
                            if self.pencils[row, c] & val_bit:
                                self.pencils[row, c] &= not_val_bit
                                changed += 1

                    # Check if all candidates are in the same column
                    cols = {c for r, c in box_cells}
                    if len(cols) == 1:
                        col = cols.pop()
                        # Eliminate from rest of the column (outside this box)
                        for r in range(9):
                            if br <= r < br + 3:
                                continue  # Skip cells in the box
                            if self.pencils[r, col] & val_bit:
                                self.pencils[r, col] &= not_val_bit
                                changed += 1

        return changed


    def solve_claiming(self):
        """
        Box/Line Reduction (Claiming):
        If a candidate in a row/column appears only within one box,
        eliminate it from the rest of that box.
        Returns the number of eliminations made.
        """
        changed = 0

        for val in range(1, 10):
            val_bit = np.uint16(1 << (val - 1))
            not_val_bit = 0xFFFF ^ val_bit

            # Check each row
            for r in range(9):
                # Find columns where this candidate appears
                cols_with_candidate = [c for c in range(9) if self.pencils[r, c] & val_bit]
                
                if len(cols_with_candidate) == 0:
                    continue

                # Check if all are in the same box (same box column: 0-2, 3-5, or 6-8)
                box_cols = {c // 3 for c in cols_with_candidate}
                if len(box_cols) == 1:
                    bc = box_cols.pop() * 3  # Box column start
                    br = (r // 3) * 3  # Box row start

                    # Eliminate from rest of the box (other rows in this box)
                    for box_r in range(br, br + 3):
                        if box_r == r:
                            continue  # Skip the row we're analyzing
                        for box_c in range(bc, bc + 3):
                            if self.pencils[box_r, box_c] & val_bit:
                                self.pencils[box_r, box_c] &= not_val_bit
                                changed += 1

            # Check each column
            for c in range(9):
                # Find rows where this candidate appears
                rows_with_candidate = [r for r in range(9) if self.pencils[r, c] & val_bit]
                
                if len(rows_with_candidate) == 0:
                    continue

                # Check if all are in the same box (same box row: 0-2, 3-5, or 6-8)
                box_rows = {r // 3 for r in rows_with_candidate}
                if len(box_rows) == 1:
                    br = box_rows.pop() * 3  # Box row start
                    bc = (c // 3) * 3  # Box column start

                    # Eliminate from rest of the box (other columns in this box)
                    for box_r in range(br, br + 3):
                        for box_c in range(bc, bc + 3):
                            if box_c == c:
                                continue  # Skip the column we're analyzing
                            if self.pencils[box_r, box_c] & val_bit:
                                self.pencils[box_r, box_c] &= not_val_bit
                                changed += 1

        return changed


    def solve_fish(self, size=2):
        """
        Generic fish solver (X-Wing, Swordfish, Jellyfish).
        size = 2 → X-Wing
        size = 3 → Swordfish
        size = 4 → Jellyfish
        
        Fish pattern: If a candidate appears in exactly N rows, and these
        occurrences span exactly N columns, then the candidate can be
        eliminated from all other cells in those N columns.
        (And vice versa for columns → rows)
        
        Returns the number of eliminations made.
        """
        changed = 0

        for val in range(1, 10):
            val_bit = 1 << (val - 1)

            # === ROW-BASED FISH (eliminate from columns) ===
            # Find rows that contain this candidate
            rows_with_candidate = []
            row_columns = {}  # Map row → set of columns with candidate
            
            for r in range(9):
                cols = {c for c in range(9) if self.pencils[r, c] & val_bit}
                if 2 <= len(cols) <= size:  # Only consider rows with 2-N candidates
                    rows_with_candidate.append(r)
                    row_columns[r] = cols

            # Try all combinations of N rows
            if len(rows_with_candidate) >= size:
                for row_combo in itertools.combinations(rows_with_candidate, size):
                    # Union of all columns in these rows
                    all_cols = set.union(*(row_columns[r] for r in row_combo))
                    
                    # Fish found: exactly N columns span these N rows
                    if len(all_cols) == size:
                        # Eliminate from these columns in OTHER rows
                        for r in range(9):
                            if r in row_combo:
                                continue  # Skip the fish rows
                            for c in all_cols:
                                if self.pencils[r, c] & val_bit:
                                    self.pencils[r, c] &= ~val_bit
                                    changed += 1

            # === COLUMN-BASED FISH (eliminate from rows) ===
            # Find columns that contain this candidate
            cols_with_candidate = []
            col_rows = {}  # Map column → set of rows with candidate
            
            for c in range(9):
                rows = {r for r in range(9) if self.pencils[r, c] & val_bit}
                if 2 <= len(rows) <= size:  # Only consider columns with 2-N candidates
                    cols_with_candidate.append(c)
                    col_rows[c] = rows

            # Try all combinations of N columns
            if len(cols_with_candidate) >= size:
                for col_combo in itertools.combinations(cols_with_candidate, size):
                    # Union of all rows in these columns
                    all_rows = set.union(*(col_rows[c] for c in col_combo))
                    
                    # Fish found: exactly N rows span these N columns
                    if len(all_rows) == size:
                        # Eliminate from these rows in OTHER columns
                        for c in range(9):
                            if c in col_combo:
                                continue  # Skip the fish columns
                            for r in all_rows:
                                if self.pencils[r, c] & val_bit:
                                    self.pencils[r, c] &= ~val_bit
                                    changed += 1

        return changed


    def solve_xwing(self):
        """
        X-Wing technique (2x2 fish pattern).
        Returns the number of eliminations made.
        """
        return self.solve_fish(size=2)


    def solve_swordfish(self):
        """
        Swordfish technique (3x3 fish pattern).
        Returns the number of eliminations made.
        """
        return self.solve_fish(size=3)


    def solve_xy_wing(self):
        """
        XY-Wing technique:
        Find a pivot cell with exactly 2 candidates (XY),
        and two wing cells each with 2 candidates (XZ and YZ),
        where the pivot sees both wings.
        Any cell that sees both wings can eliminate candidate Z.
        
        Returns the number of eliminations made.
        """
        changed = 0

        # Find all bi-value cells (cells with exactly 2 candidates)
        bi_value_cells = []
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if mask and bin(mask).count('1') == 2:
                    # Extract the two candidates
                    candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                    bi_value_cells.append((r, c, candidates[0], candidates[1]))

        # Try each bi-value cell as a pivot
        for pivot_r, pivot_c, x, y in bi_value_cells:
            # Find wing cells that share a candidate with the pivot
            # and are visible to the pivot
            xz_wings = []  # Wings with X and some Z (not Y)
            yz_wings = []  # Wings with Y and some Z (not X)

            for wing_r, wing_c, a, b in bi_value_cells:
                if (wing_r, wing_c) == (pivot_r, pivot_c):
                    continue

                # Check if wing sees pivot (same row, column, or box)
                if not self._cells_see_each_other(pivot_r, pivot_c, wing_r, wing_c):
                    continue

                # Check if wing has X but not Y
                if x in (a, b) and y not in (a, b):
                    z = a if a != x else b
                    xz_wings.append((wing_r, wing_c, z))

                # Check if wing has Y but not X
                if y in (a, b) and x not in (a, b):
                    z = a if a != y else b
                    yz_wings.append((wing_r, wing_c, z))

            # Look for XZ and YZ wings with the same Z
            for xz_r, xz_c, z1 in xz_wings:
                for yz_r, yz_c, z2 in yz_wings:
                    if z1 != z2:
                        continue  # Z must be the same

                    z = z1
                    z_bit = 1 << (z - 1)

                    # Find cells that see both wings
                    for r in range(9):
                        for c in range(9):
                            if (r, c) in [(pivot_r, pivot_c), (xz_r, xz_c), (yz_r, yz_c)]:
                                continue
                            if not (self.pencils[r, c] & z_bit):
                                continue

                            # Check if this cell sees both wings
                            if (self._cells_see_each_other(r, c, xz_r, xz_c) and
                                self._cells_see_each_other(r, c, yz_r, yz_c)):
                                self.pencils[r, c] &= ~z_bit
                                changed += 1

        return changed


    def solve_xyz_wing(self):
        """
        XYZ-Wing technique:
        Find a pivot cell with exactly 3 candidates (XYZ),
        and two wing cells each with 2 candidates (XZ and YZ),
        where both wings see the pivot.
        Any cell that sees all three cells (pivot + both wings) can eliminate Z.
        
        Returns the number of eliminations made.
        """
        changed = 0

        # Find all tri-value cells (cells with exactly 3 candidates)
        tri_value_cells = []
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if mask and bin(mask).count('1') == 3:
                    candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                    tri_value_cells.append((r, c, candidates[0], candidates[1], candidates[2]))

        # Find all bi-value cells
        bi_value_cells = []
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if mask and bin(mask).count('1') == 2:
                    candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                    bi_value_cells.append((r, c, candidates[0], candidates[1]))

        # Try each tri-value cell as a pivot
        for pivot_r, pivot_c, x, y, z in tri_value_cells:
            # Find wings that share exactly 2 of the 3 pivot candidates
            # and are visible to the pivot
            xz_wings = []  # Wings with X and Z (not Y)
            yz_wings = []  # Wings with Y and Z (not X)

            for wing_r, wing_c, a, b in bi_value_cells:
                if (wing_r, wing_c) == (pivot_r, pivot_c):
                    continue

                # Check if wing sees pivot
                if not self._cells_see_each_other(pivot_r, pivot_c, wing_r, wing_c):
                    continue

                # Check if wing is XZ
                if set([a, b]) == set([x, z]):
                    xz_wings.append((wing_r, wing_c))

                # Check if wing is YZ
                if set([a, b]) == set([y, z]):
                    yz_wings.append((wing_r, wing_c))

            # Look for XZ and YZ wing pairs
            for xz_r, xz_c in xz_wings:
                for yz_r, yz_c in yz_wings:
                    z_bit = 1 << (z - 1)

                    # Find cells that see all three: pivot and both wings
                    for r in range(9):
                        for c in range(9):
                            if (r, c) in [(pivot_r, pivot_c), (xz_r, xz_c), (yz_r, yz_c)]:
                                continue
                            if not (self.pencils[r, c] & z_bit):
                                continue

                            # Check if this cell sees all three
                            if (self._cells_see_each_other(r, c, pivot_r, pivot_c) and
                                self._cells_see_each_other(r, c, xz_r, xz_c) and
                                self._cells_see_each_other(r, c, yz_r, yz_c)):
                                self.pencils[r, c] &= ~z_bit
                                changed += 1

        return changed


    def _cells_see_each_other(self, r1, c1, r2, c2):
        """Helper: Check if two cells can see each other (same row, column, or box)."""
        if r1 == r2 or c1 == c2:
            return True
        if (r1 // 3 == r2 // 3) and (c1 // 3 == c2 // 3):
            return True
        return False


    def solve_unique_rectangles(self):
        """
        Unique Rectangles (UR) technique:
        Looks for potential deadly patterns (4 corners of a rectangle with same 2 candidates)
        and eliminates candidates to avoid multiple solutions.
        
        Types handled:
        - Type 1: Three corners are bi-value XY, fourth has XY + extra candidates
        - Type 2: Two opposite corners are bi-value XY, other two have XY + same extra candidates
        
        Returns the number of eliminations made.
        """
        changed = 0

        # Find all bi-value cells (exactly 2 candidates)
        bi_value_cells = {}
        for r in range(9):
            for c in range(9):
                # Skip starting/given cells - UR only works on solved/candidate cells
                if self.types[r, c] == CellValue.STARTING:
                    continue
                mask = self.pencils[r, c]
                if mask and bin(mask).count('1') == 2:
                    candidates = tuple(sorted([i + 1 for i in range(9) if mask & (1 << i)]))
                    if candidates not in bi_value_cells:
                        bi_value_cells[candidates] = []
                    bi_value_cells[candidates].append((r, c))

        # For each pair of candidates, look for rectangles
        for (x, y), cells in bi_value_cells.items():
            if len(cells) < 3:
                continue

            # Try all combinations of cells to find rectangles
            for i, (r1, c1) in enumerate(cells):
                for j, (r2, c2) in enumerate(cells[i + 1:], i + 1):
                    # Must be in different rows and columns
                    if r1 == r2 or c1 == c2:
                        continue
                    # Must be in different boxes (deadly pattern condition)
                    if (r1 // 3 == r2 // 3) and (c1 // 3 == c2 // 3):
                        continue

                    # The other two corners of the rectangle
                    r3, c3 = r1, c2
                    r4, c4 = r2, c1

                    # Skip if corners are starting cells
                    if (self.types[r3, c3] == CellValue.STARTING or 
                        self.types[r4, c4] == CellValue.STARTING):
                        continue

                    mask3 = self.pencils[r3, c3]
                    mask4 = self.pencils[r4, c4]

                    if not mask3 or not mask4:
                        continue

                    xy_mask = (1 << (x - 1)) | (1 << (y - 1))

                    # === TYPE 1: Three corners bi-value XY, one has extras ===
                    # Check if corner 3 has XY + extras, corner 4 is exactly XY
                    if mask4 == xy_mask and (mask3 & xy_mask) == xy_mask and mask3 != xy_mask:
                        # Eliminate X and Y from corner 3
                        self.pencils[r3, c3] &= ~xy_mask
                        changed += 1
                        continue

                    # Check if corner 4 has XY + extras, corner 3 is exactly XY
                    if mask3 == xy_mask and (mask4 & xy_mask) == xy_mask and mask4 != xy_mask:
                        # Eliminate X and Y from corner 4
                        self.pencils[r4, c4] &= ~xy_mask
                        changed += 1
                        continue

                    # === TYPE 2: Opposite corners both have XY + same extra Z ===
                    # Check if both corners 3 and 4 have XY as subset
                    if (mask3 & xy_mask) == xy_mask and (mask4 & xy_mask) == xy_mask:
                        # Get the extra candidates (not X or Y)
                        extra3 = mask3 & ~xy_mask
                        extra4 = mask4 & ~xy_mask

                        if extra3 and extra3 == extra4:
                            # Both have the same extra candidate(s) Z
                            # Apply naked pair/triple logic: eliminate Z from cells that see both corners
                            for r in range(9):
                                for c in range(9):
                                    if (r, c) in [(r1, c1), (r2, c2), (r3, c3), (r4, c4)]:
                                        continue
                                    if not self.pencils[r, c]:
                                        continue

                                    # Check if this cell sees both corner 3 and corner 4
                                    if (self._cells_see_each_other(r, c, r3, c3) and
                                        self._cells_see_each_other(r, c, r4, c4)):
                                        before = self.pencils[r, c]
                                        self.pencils[r, c] &= ~extra3
                                        if self.pencils[r, c] != before:
                                            changed += 1

        return changed


    def solve_x_chains(self):
        """
        X-Chains (Simple Coloring):
        For each candidate, build chains of strongly linked cells (bi-location links).
        Color the chain with two colors. Apply elimination rules:
        
        Rule 1: If two cells of the same color see each other, eliminate that color
        Rule 2: If a cell sees both colors, eliminate the candidate from that cell
        Rule 3: If one color appears twice in a unit, eliminate that color
        
        Returns the number of eliminations made.
        """
        changed = 0

        for val in range(1, 10):
            val_bit = 1 << (val - 1)

            # Build adjacency graph of strongly linked cells
            # Strong link: only 2 positions for this candidate in a unit
            strong_links = set()

            # Check rows for strong links
            for r in range(9):
                positions = [(r, c) for c in range(9) if self.pencils[r, c] & val_bit]
                if len(positions) == 2:
                    strong_links.add(tuple(sorted(positions)))

            # Check columns for strong links
            for c in range(9):
                positions = [(r, c) for r in range(9) if self.pencils[r, c] & val_bit]
                if len(positions) == 2:
                    strong_links.add(tuple(sorted(positions)))

            # Check boxes for strong links
            for br in range(0, 9, 3):
                for bc in range(0, 9, 3):
                    positions = [(r, c) for r in range(br, br + 3) 
                                for c in range(bc, bc + 3) 
                                if self.pencils[r, c] & val_bit]
                    if len(positions) == 2:
                        strong_links.add(tuple(sorted(positions)))

            if not strong_links:
                continue

            # Build adjacency list
            adjacency = {}
            for (cell1, cell2) in strong_links:
                if cell1 not in adjacency:
                    adjacency[cell1] = []
                if cell2 not in adjacency:
                    adjacency[cell2] = []
                adjacency[cell1].append(cell2)
                adjacency[cell2].append(cell1)

            # Color each connected chain
            colored = {}  # cell -> color (0 or 1)
            
            for start_cell in adjacency:
                if start_cell in colored:
                    continue

                # BFS to color this chain
                queue = [start_cell]
                colored[start_cell] = 0

                while queue:
                    cell = queue.pop(0)
                    current_color = colored[cell]
                    next_color = 1 - current_color

                    for neighbor in adjacency.get(cell, []):
                        if neighbor in colored:
                            # Check for contradiction
                            if colored[neighbor] == current_color:
                                # Same color sees each other - invalid
                                # This shouldn't happen in valid chains
                                pass
                        else:
                            colored[neighbor] = next_color
                            queue.append(neighbor)

            # Apply elimination rules
            color_groups = {0: [], 1: []}
            for cell, color in colored.items():
                color_groups[color].append(cell)

            # Rule 1 & 3: Check if cells of same color see each other or appear twice in unit
            invalid_colors = set()
            for color in [0, 1]:
                cells = color_groups[color]
                # Check if any two cells of same color see each other
                for i, (r1, c1) in enumerate(cells):
                    for r2, c2 in cells[i + 1:]:
                        if self._cells_see_each_other(r1, c1, r2, c2):
                            invalid_colors.add(color)
                            break
                    if color in invalid_colors:
                        break

            # Eliminate invalid colors
            for color in invalid_colors:
                for r, c in color_groups[color]:
                    if self.pencils[r, c] & val_bit:
                        self.pencils[r, c] &= ~val_bit
                        changed += 1

            # Rule 2: Cells that see both colors can eliminate the candidate
            for r in range(9):
                for c in range(9):
                    if (r, c) in colored:
                        continue
                    if not (self.pencils[r, c] & val_bit):
                        continue

                    sees_color = [False, False]
                    for color in [0, 1]:
                        for cr, cc in color_groups[color]:
                            if self._cells_see_each_other(r, c, cr, cc):
                                sees_color[color] = True
                                break

                    if sees_color[0] and sees_color[1]:
                        self.pencils[r, c] &= ~val_bit
                        changed += 1

        return changed


    def solve_forcing_chains(self):
        """
        General Forcing Chains (Cell and Unit forcing):
        
        Cell Forcing: If a cell has only 2-3 candidates, try each one and see if they
        all lead to the same elimination or placement in another cell.
        
        Unit Forcing: If a candidate appears in only 2-3 positions in a unit,
        try each position and see if they lead to the same conclusion.
        
        Returns the number of eliminations made.
        Limited depth search to avoid excessive computation.
        """
        changed = 0
        MAX_DEPTH = 3  # Limit chain depth

        # === CELL FORCING ===
        # Find cells with 2-3 candidates
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if not mask:
                    continue
                
                candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                if len(candidates) not in [2, 3]:
                    continue

                # Try each candidate and see what eliminations result
                common_eliminations = None

                for val in candidates:
                    # Create a copy and apply this candidate
                    test_grid = self._copy_state()
                    test_grid[r, c] = (1 << (val - 1))  # Set to single candidate
                    
                    # Propagate constraints
                    eliminations = self._propagate_simple(test_grid, max_steps=MAX_DEPTH)
                    
                    if eliminations is None:  # Contradiction found
                        # This candidate leads to invalid state
                        if self.pencils[r, c] & (1 << (val - 1)):
                            self.pencils[r, c] &= ~(1 << (val - 1))
                            changed += 1
                        break
                    
                    if common_eliminations is None:
                        common_eliminations = eliminations.copy()
                    else:
                        # Keep only common eliminations
                        common_eliminations = {k: v for k, v in common_eliminations.items() 
                                              if k in eliminations and eliminations[k] == v}

                # Apply common eliminations
                if common_eliminations:
                    for (tr, tc), tmask in common_eliminations.items():
                        if self.pencils[tr, tc] != tmask:
                            self.pencils[tr, tc] = tmask
                            changed += 1

        return changed


    def _copy_state(self):
        """Create a copy of the current pencil marks."""
        return self.pencils.copy()


    def _propagate_simple(self, test_pencils, max_steps=3):
        """
        Propagate constraints on test grid for a limited number of steps.
        Returns dict of cell positions to their resulting pencil masks,
        or None if contradiction found.
        """
        original_pencils = self.pencils
        self.pencils = test_pencils
        
        try:
            for _ in range(max_steps):
                # Apply naked singles
                single_mask = (self.pencils != 0) & ((self.pencils & (self.pencils - 1)) == 0)
                single_indices = np.argwhere(single_mask)
                
                if len(single_indices) == 0:
                    break
                
                for r, c in single_indices:
                    bit = self.pencils[r, c]
                    if bit == 0:
                        continue
                    value = int(np.log2(bit)) + 1
                    
                    # Check for contradictions
                    bitmask = 0xFFFF ^ np.uint16(1 << (value - 1))
                    
                    # Check row
                    if np.any((self.pencils[r, :] & (1 << (value - 1))) & 
                             (self.pencils[r, :] != bit)):
                        # Would eliminate all candidates from a cell
                        for check_c in range(9):
                            if check_c != c and self.pencils[r, check_c] == bit:
                                self.pencils = original_pencils
                                return None
                    
                    self.pencils[r, c] = 0
                    self.pencils[r, :] &= bitmask
                    self.pencils[:, c] &= bitmask
                    br, bc = (r // 3) * 3, (c // 3) * 3
                    self.pencils[br:br+3, bc:bc+3] &= bitmask
                    
                    # Check for cells with no candidates (contradiction)
                    if np.any((self.pencils == 0) & (original_pencils != 0)):
                        self.pencils = original_pencils
                        return None
            
            result = {(r, c): self.pencils[r, c] 
                     for r in range(9) for c in range(9) 
                     if self.pencils[r, c] != original_pencils[r, c]}
            
            self.pencils = original_pencils
            return result
            
        except Exception:
            self.pencils = original_pencils
            return None
    
    #######################################################################################################
    #                   STRING
    #######################################################################################################

    def __str__(self):
        border = '+' + '-' * 53 + '+\n'
        text = border
        for r in range(9):
            for j in range(3):
                text += '|'
                for c in range(9):
                    if self.types[r, c] == CellValue.PENCIL:
                        line = ''.join(
                            str(i) if self.get_pencil(i, c + 1, r + 1) else '.'
                            for i in range(1 + j * 3, 4 + j * 3)
                        )
                        text += ' '.join(line)
                    else:
                        text += f"  {self.values[r, c]}  " if j == 1 else "     "
                    text += '|'
                text += '\n'
            text += border
        return text
    
    def to_dict(self):
        """
        Convert grid to dictionary for JSON serialization.
        Returns a dict with values, types, and pencil marks.
        """
        # Convert values and types to lists
        values_list = self.values.tolist()
        types_list = self.types.tolist()
        
        # Convert pencil marks to list of candidates for each cell
        pencils_list = []
        for r in range(9):
            row = []
            for c in range(9):
                mask = self.pencils[r, c]
                if mask == 0:
                    row.append([])
                else:
                    # Extract all set bits as candidate numbers
                    candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                    row.append(candidates)
            pencils_list.append(row)
        
        return {
            'values': values_list,
            'types': types_list,
            'pencils': pencils_list
        }
    
    def update_from_dict(self, data):
        # Restore numpy arrays for values and types
        self.values = np.array(data['values'])
        self.types = np.array(data['types'])

        # Reconstruct pencil marks from candidate lists
        pencils_array = np.zeros((9, 9), dtype=np.uint16)
        for r in range(9):
            for c in range(9):
                candidates = data['pencils'][r][c]
                mask = 0
                for n in candidates:
                    mask |= (1 << (n - 1))
                pencils_array[r, c] = mask

        self.pencils = pencils_array
    
    
    @classmethod
    def from_dict(cls, data):
        """
        Reconstruct grid from dictionary created by to_dict().
        Expects a dict with 'values', 'types', and 'pencils'.
        """

        # Create an empty instance (assuming __init__ sets up arrays)
        obj = cls.__new__(cls)

        # Restore numpy arrays for values and types
        obj.values = np.array(data['values'])
        obj.types = np.array(data['types'])

        # Reconstruct pencil marks from candidate lists
        pencils_array = np.zeros((9, 9), dtype=np.uint16)
        for r in range(9):
            for c in range(9):
                candidates = data['pencils'][r][c]
                mask = 0
                for n in candidates:
                    mask |= (1 << (n - 1))
                pencils_array[r, c] = mask

        obj.pencils = pencils_array

        return obj

                